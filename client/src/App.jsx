import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './App.css';

function App() {
    const [question, setQuestion] = useState(null);
    const [showHint, setShowHint] = useState(false);
    const [showSolution, setShowSolution] = useState(false);
    const [showDashboard, setShowDashboard] = useState(false);
    const [userId] = useState('user1'); // Example user ID, could be from auth context

    useEffect(() => {
        fetchQuestion();
    }, []);

    const fetchQuestion = async () => {
        try {
            const response = await axios.get('http://localhost:5000/question');
            setQuestion(response.data);
            setShowHint(false);
            setShowSolution(false);
            setShowDashboard(false); // Hide dashboard when fetching a new question
        } catch (error) {
            console.error('Error fetching question:', error);
        }
    };

    const handleKnowCategory = async () => {
        try {
            await axios.post('http://localhost:5000/know-category', {
                user_id: userId,
                category: question.category
            });
            fetchQuestion();
        } catch (error) {
            console.error('Error marking category as known:', error);
        }
    };

    if (!question && !showDashboard) return <div>Loading...</div>;

    return (
        <div className="App">
            <header className="Header">
                <h1>InterviewPrep AI</h1>
                <div className="header-buttons">
                    <button className="sign-out-button">Sign Out</button>
                    <button className="dashboard-button" onClick={() => setShowDashboard(!showDashboard)}>
                        {showDashboard ? 'Hide Dashboard' : 'Show Dashboard'}
                    </button>
                </div>
            </header>

            <div className="content">
                {showDashboard ? (
                    <iframe
                        src="http://localhost:5000/dashboard"
                        title="Dashboard"
                        width="100%"
                        height="600px"
                        className="dashboard-iframe"
                    />
                ) : (
                    <div className='cardContainer'>
                        <div className="card">
                            <h1>{question.question}</h1>
                            <p><strong>Description:</strong> {question.description}</p>
                            <p><strong>Constraints:</strong> {question.constraints}</p>
                            {showHint && <p><strong>Hint:</strong> {question.hint}</p>}
                            {showSolution && (
                                <div className="solution-box">
                                    <p><strong>Solution:</strong></p>
                                    <pre><code>{question.code_solution}</code></pre>
                                </div>
                            )}
                            <button onClick={() => setShowHint(!showHint)}>
                                {showHint ? 'Hide Hint' : 'Show Hint'}
                            </button>
                            <button onClick={() => setShowSolution(!showSolution)}>
                                {showSolution ? 'Hide Solution' : 'Show Solution'}
                            </button>
                            <button onClick={handleKnowCategory}>
                                I Know This
                            </button>
                            <button onClick={fetchQuestion}>
                                Next Question
                            </button>
                        </div>
                    </div>
                )}
            </div>

            {!showDashboard && (
                <footer className="Footer">
                    <p>&copy; 2024 InterviewPrep AI - All rights reserved.</p>
                </footer>
            )}
        </div>
    );
}

export default App;
