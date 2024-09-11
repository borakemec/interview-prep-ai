import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './App.css';

function App() {
    const [question, setQuestion] = useState(null);
    const [showHint, setShowHint] = useState(false);
    const [isFlipped, setIsFlipped] = useState(false); // State to track the card flip
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
            setIsFlipped(false); // Reset flip when fetching a new question
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
                    <div className="cards-container">
                        <div className="card trivia-card" id='triviaCard'>
                            <h2>Trivia</h2>
                            <p>{question.trivia}</p>
                        </div>

                        {/* Flip Card Container */}
                        <div className={`flip-card ${isFlipped ? 'flipped' : ''}`}>
                            <div className="flip-card-inner">
                                {/* Front Side */}
                                <div className="flip-card-front">
                                    <h1>{question.question}</h1>
                                    <p><strong>Description:</strong> {question.description}</p>
                                    <p><strong>Constraints:</strong> {question.constraints}</p>
                                    {showHint && <p><strong>Hint:</strong> {question.hint}</p>}
                                    <button onClick={() => setShowHint(!showHint)}>
                                        <i className="fas fa-lightbulb"></i> {showHint ? 'Hide Hint' : 'Show Hint'}
                                    </button>
                                    <button onClick={() => setIsFlipped(true)}> {/* Flip the card */}
                                        <i className="fas fa-book"></i> Show Solution
                                    </button>
                                    <button onClick={handleKnowCategory}>
                                        <i className="fas fa-check"></i> I Know This
                                    </button>
                                    <button onClick={fetchQuestion}>
                                        <i className="fas fa-arrow-right"></i> Next Question
                                    </button>
                                </div>

                                {/* Back Side (Solution) */}
                                <div className="flip-card-back">
                                    <h2>Solution</h2>
                                    <pre><code>{question.code_solution}</code></pre>
                                    <button onClick={() => setIsFlipped(false)}> {/* Flip back */}
                                        Back to Question
                                    </button>
                                </div>
                            </div>
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
