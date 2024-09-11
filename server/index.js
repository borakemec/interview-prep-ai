require('dotenv').config(); // Add this line at the top of your file

const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const axios = require('axios');

const app = express();
app.use(express.json());
app.use(cors());

app.use('/assets', express.static(path.join(__dirname, 'public', 'assets')));

const OPENAI_API_KEY = process.env.OPENAI_API_KEY; // Use the environment variable

const DB_FILE = './questions.db'; // Path to the database file

// Delete the database file if it exists
if (fs.existsSync(DB_FILE)) {
    console.log('Deleting existing database...');
    fs.unlinkSync(DB_FILE);
    console.log('Database deleted.');
}

// Recreate the database
const db = new sqlite3.Database(DB_FILE);

// Create tables and add 'shown' column if not already present
db.serialize(() => {
    db.run(`
        CREATE TABLE IF NOT EXISTS questions (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            question TEXT,
            description TEXT,
            constraints TEXT,
            hint TEXT,
            solution TEXT,
            code_solution TEXT,
            category TEXT,
            trivia TEXT,
            shown INTEGER DEFAULT 0
        )
    `);
    db.run(`
        CREATE TABLE IF NOT EXISTS user_knowledge (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id TEXT,
            category TEXT
        )
    `);
});

// Function to contact OpenAI API and generate new question
const generateNewQuestion = async (excludedQuestions, excludedCategories) => {
    const prompt = `
    Create a question that is a coding problem like problems from LeetCode, different from these existing questions: ${excludedQuestions.join(', ')}. 
    Also, do not use categories from the following list: ${excludedCategories.join(', ')}.

    Please format the response like this:
    {
        "question": "Your question here",
        "description": "Description of the problem",
        "constraints": "Constraints of the problem",
        "hint": "Hint for the solution",
        "solution": "Explanation of the solution",
        "code_solution": "Code solution in JavaScript",
        "category": "Relevant category (e.g. array, linked list, dynamic programming)",
        "trivia": "Any trivia about the question something like 'this question is asked in these companies' interviews' or any other fact about the question that may be interesting"
    }
    `;

    try {
        const response = await axios.post(
            'https://api.openai.com/v1/chat/completions',
            {
                model: 'gpt-3.5-turbo',
                messages: [{ role: 'user', content: prompt }],
                max_tokens: 500,
                temperature: 0.5,
                n: 1,
            },
            {
                headers: {
                    'Authorization': `Bearer ${OPENAI_API_KEY}`,
                    'Content-Type': 'application/json',
                },
            }
        );

        const generatedQuestion = JSON.parse(response.data.choices[0].message.content.trim());
        return generatedQuestion;

    } catch (error) {
        console.error('Error generating question from OpenAI:', error.response ? error.response.data : error.message);
        return null;
    }
};

// Function to seed questions (if needed)
const seedQuestions = () => {
    const questions = [
        {
            question: 'Two Sum',
            description: 'Given an array of integers, return indices of the two numbers such that they add up to a specific target.',
            constraints: 'The array has at most 10^4 elements.',
            hint: 'Try using a hash map to store the indices.',
            solution: 'You can use a hash map to check if the complement of the current element exists.',
            code_solution: `function twoSum(nums, target) {
                const map = new Map();
                for (let i = 0; i < nums.length; i++) {
                    const complement = target - nums[i];
                    if (map.has(complement)) {
                        return [map.get(complement), i];
                    }
                    map.set(nums[i], i);
                }
            }`,
            category: 'Array',
            trivia: 'This question is frequently asked in interviews at companies like Google, Amazon, and Facebook.',
        },
        {
            question: 'Reverse Linked List',
            description: 'Reverse a singly linked list.',
            constraints: 'The list has at most 5000 nodes.',
            hint: 'Consider using a three-pointer approach.',
            solution: 'You can reverse the list by changing the next pointers of the nodes.',
            code_solution: `function reverseList(head) {
                let prev = null;
                let curr = head;
                while (curr !== null) {
                    let next = curr.next;
                    curr.next = prev;
                    prev = curr;
                    curr = next;
                }
                return prev;
            }`,
            category: 'Linked List',
            trivia: 'A common question to assess your understanding of data structures.',
        }
    ];

    const stmt = db.prepare('INSERT INTO questions (question, description, constraints, hint, solution, code_solution, category, trivia, shown) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 0)');

    questions.forEach((q) => {
        stmt.run(q.question, q.description, q.constraints, q.hint, q.solution, q.code_solution, q.category, q.trivia);
    });

    stmt.finalize();
    console.log('Database seeded with questions.');
};

// Call the seedQuestions function to initialize questions
seedQuestions();

// Helper function to get excluded questions and categories
const getExcludedData = async (userId) => {
    return new Promise((resolve, reject) => {
        const excludedData = {
            excludedQuestions: [],
            excludedCategories: []
        };

        // Get all question names
        db.all('SELECT question FROM questions', (err, rows) => {
            if (err) {
                return reject(err);
            }
            excludedData.excludedQuestions = rows.map(row => row.question);

            // Get all known categories for the user
            db.all('SELECT category FROM user_knowledge WHERE user_id = ?', [userId], (err, categoryRows) => {
                if (err) {
                    return reject(err);
                }
                excludedData.excludedCategories = categoryRows.map(row => row.category);
                resolve(excludedData);
            });
        });
    });
};

// Route to get an unshown question or generate a new one if all are shown
app.get('/question', async (req, res) => {
    const userId = 'user1'; // Hardcoded user ID, you can make this dynamic based on authentication

    db.get('SELECT * FROM questions WHERE shown = 0 ORDER BY RANDOM() LIMIT 1', async (err, row) => {
        if (err) {
            return res.status(500).json({ error: err.message });
        }

        if (!row) {
            // If no more questions are available, fetch excluded questions and categories
            try {
                const { excludedQuestions, excludedCategories } = await getExcludedData(userId);

                console.log('No more questions available, generating new one...');
                const generatedQuestion = await generateNewQuestion(excludedQuestions, excludedCategories);

                if (generatedQuestion) {
                    // Add the generated question to the database
                    db.run(
                        'INSERT INTO questions (question, description, constraints, hint, solution, code_solution, category, trivia, shown) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 1)',
                        [
                            generatedQuestion.question,
                            generatedQuestion.description,
                            generatedQuestion.constraints,
                            generatedQuestion.hint,
                            generatedQuestion.solution,
                            generatedQuestion.code_solution,
                            generatedQuestion.category,
                            generatedQuestion.trivia,
                        ],
                        function (err) {
                            if (err) {
                                return res.status(500).json({ error: err.message });
                            }
                            console.log('Generated question added to the database.');
                            res.json(generatedQuestion);
                        }
                    );
                } else {
                    return res.status(500).json({ message: 'Error generating question.' });
                }
            } catch (error) {
                console.error('Error fetching excluded questions/categories:', error);
                return res.status(500).json({ message: 'Error fetching excluded questions/categories.' });
            }
        } else {
            // Mark the question as shown
            db.run('UPDATE questions SET shown = 1 WHERE id = ?', [row.id], (err) => {
                if (err) {
                    return res.status(500).json({ error: err.message });
                }
                res.json(row);
            });
        }
    });
});

app.get('/dashboard', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'pages/dashboard.html'));
});

// Route to mark a question's category as known for the user
app.post('/know-category', (req, res) => {
    const { user_id, category } = req.body;
    db.run('INSERT INTO user_knowledge (user_id, category) VALUES (?, ?)', [user_id, category], function(err) {
        if (err) {
            return res.status(500).json({ error: err.message });
        }
        res.status(201).json({ id: this.lastID });
    });
});

// Start the server
app.listen(5000, () => {
    console.log('Server running on port 5000');
});
