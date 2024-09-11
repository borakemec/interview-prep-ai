const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const cors = require('cors');
const path = require('path');

const app = express();
app.use(express.json());
app.use(cors());

app.use(express.static(path.join(__dirname, 'public')));


const db = new sqlite3.Database('./questions.db');

// Create tables with new schema
db.serialize(() => {
    db.run(`CREATE TABLE IF NOT EXISTS questions (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        question TEXT,
        description TEXT,
        constraints TEXT,
        hint TEXT,
        solution TEXT,
        code_solution TEXT,
        category TEXT
    )`);
    db.run(`CREATE TABLE IF NOT EXISTS user_knowledge (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id TEXT,
        category TEXT
    )`);
});

// Serve the HTML file on the /dashboard route
app.get('/dashboard', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'pages/dashboard.html'));
});


// Get a random question
app.get('/question', (req, res) => {
    db.get('SELECT * FROM questions ORDER BY RANDOM() LIMIT 1', (err, row) => {
        if (err) {
            return res.status(500).json({ error: err.message });
        }
        res.json(row);
    });
});

// Mark category as known
app.post('/know-category', (req, res) => {
    const { user_id, category } = req.body;
    db.run('INSERT INTO user_knowledge (user_id, category) VALUES (?, ?)', [user_id, category], function(err) {
        if (err) {
            return res.status(500).json({ error: err.message });
        }
        res.status(201).json({ id: this.lastID });
    });
});

// Seed the database with LeetCode-like questions
app.post('/seed', (req, res) => {
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
            category: 'array'
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
            category: 'linked list'
        },
        {
            question: 'Longest Substring Without Repeating Characters',
            description: 'Given a string, find the length of the longest substring without repeating characters.',
            constraints: 'The string has at most 10^5 characters.',
            hint: 'Use a sliding window approach.',
            solution: 'A sliding window with a hash set can help keep track of unique characters.',
            code_solution: `function lengthOfLongestSubstring(s) {
    let map = new Map();
    let left = 0;
    let maxLength = 0;
    for (let right = 0; right < s.length; right++) {
        if (map.has(s[right])) {
            left = Math.max(map.get(s[right]) + 1, left);
        }
        map.set(s[right], right);
        maxLength = Math.max(maxLength, right - left + 1);
    }
    return maxLength;
}`,
            category: 'string'
        },
        {
            question: 'Climbing Stairs',
            description: 'You are climbing a staircase. It takes `n` steps to reach the top. Each time you can either climb 1 or 2 steps. In how many distinct ways can you climb to the top?',
            constraints: '1 <= n <= 45',
            hint: 'Use dynamic programming to build up the solution.',
            solution: 'The problem can be solved using a dynamic programming approach similar to Fibonacci sequence.',
            code_solution: `function climbStairs(n) {
    if (n <= 2) return n;
    let a = 1, b = 2;
    for (let i = 3; i <= n; i++) {
        let temp = a + b;
        a = b;
        b = temp;
    }
    return b;
}`,
            category: 'dynamic programming'
        },
        {
            question: 'Number of Islands',
            description: 'Given a 2D binary grid map of `1`s (land) and `0`s (water), count the number of islands. An island is surrounded by water and is formed by connecting adjacent lands horizontally or vertically.',
            constraints: 'The grid is m x n, where 1 <= m, n <= 50.',
            hint: 'Use Depth-First Search (DFS) or Breadth-First Search (BFS) to traverse the grid.',
            solution: 'A DFS or BFS approach can be used to explore each island and mark visited land cells.',
            code_solution: `function numIslands(grid) {
    if (grid.length === 0) return 0;

    function dfs(i, j) {
        if (i < 0 || i >= grid.length || j < 0 || j >= grid[0].length || grid[i][j] === '0') return;
        grid[i][j] = '0';
        dfs(i - 1, j);
        dfs(i + 1, j);
        dfs(i, j - 1);
        dfs(i, j + 1);
    }

    let count = 0;
    for (let i = 0; i < grid.length; i++) {
        for (let j = 0; j < grid[0].length; j++) {
            if (grid[i][j] === '1') {
                dfs(i, j);
                count++;
            }
        }
    }
    return count;
}`,
            category: 'graph'
        }
    ];

    const stmt = db.prepare('INSERT INTO questions (question, description, constraints, hint, solution, code_solution, category) VALUES (?, ?, ?, ?, ?, ?, ?)');

    questions.forEach(q => {
        stmt.run(q.question, q.description, q.constraints, q.hint, q.solution, q.code_solution, q.category);
    });

    stmt.finalize();

    res.send('Questions seeded');
});

app.listen(5000, () => {
    console.log('Server running on port 5000');
});
