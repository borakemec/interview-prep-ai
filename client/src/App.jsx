import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './App.css';

function App() {
    const [question, setQuestion] = useState(null);
    const [showHint, setShowHint] = useState(false);
    const [showSolution, setShowSolution] = useState(false);
    const [showDashboard, setShowDashboard] = useState(false);
    const [loading, setLoading] = useState(false); // Loading state
    const [isFlipped, setIsFlipped] = useState(false); // Flip state for card
    const [userId] = useState('user1'); // Example user ID, could be from auth context

    useEffect(() => {
        fetchQuestion();
    }, []);

    const fetchQuestion = async () => {
        try {
            setLoading(true); // Start loading
            const response = await axios.get('https://interview-prep-ai-production.up.railway.app/question');
            setQuestion(response.data);
            setShowHint(false);
            setShowSolution(false);
            setShowDashboard(false); // Hide dashboard when fetching a new question
            setIsFlipped(false); // Reset flip when fetching a new question
        } catch (error) {
            console.error('Error fetching question:', error);
        } finally {
            setLoading(false); // Stop loading
        }
    };

    const handleKnowCategory = async () => {
        try {
            await axios.post('https://interview-prep-ai-production.up.railway.app/know-category', {
                user_id: userId,
                category: question.category
            });
            fetchQuestion();
        } catch (error) {
            console.error('Error marking category as known:', error);
        }
    };

    const toggleFlip = () => {
        setIsFlipped(!isFlipped); // Toggle the flip state
        setShowSolution(!showSolution); // Show solution when flipping
    };

    if (loading) {
        return (
            <div className="loading-container">
                <div className="loading-spinner"></div>
                <p>Generating a new question...</p>
            </div>
        );
    }

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
                        src="https://interview-prep-ai-production.up.railway.app/dashboard"
                        title="Dashboard"
                        width="100%"
                        height="600px"
                        className="dashboard-iframe"
                    />
                ) : (
                    <div className="cards-container">
                        {/* Trivia card on the left */}
                        <div className="card trivia-card" id='triviaCard'>
                            <h2>Trivia</h2>
                            <p>{question.trivia}</p>
                        </div>

                        {/* Flip card for question */}
                        <div className={`flip-card ${isFlipped ? 'flipped' : ''}`}>
                            <div className="flip-card-inner">
                                {/* Front of the card */}
                                <div className="flip-card-front">
                                    <h1>{question.question}</h1>
                                    <p><strong>Description:</strong> {question.description}</p>
                                    <p><strong>Constraints:</strong> {question.constraints}</p>
                                    {showHint && <p><strong>Hint:</strong> {question.hint}</p>}
                                    <button onClick={() => setShowHint(!showHint)}>
                                        <i className="fas fa-lightbulb"></i> {showHint ? 'Hide Hint' : 'Show Hint'}
                                    </button>
                                    <button onClick={toggleFlip}>
                                        <i className="fas fa-book"></i> {showSolution ? 'Hide Solution' : 'Show Solution'}
                                    </button>
                                    <button onClick={handleKnowCategory}>
                                        <i className="fas fa-check"></i> I Know This
                                    </button>
                                    <button onClick={fetchQuestion}>
                                        <i className="fas fa-arrow-right"></i> Next Question
                                    </button>
                                </div>
                                {/* Back of the card */}
                                <div className="flip-card-back">
                                    <p><strong>Solution:</strong></p>
                                    <pre><code>{question.code_solution}</code></pre>
                                    <button onClick={toggleFlip}>Go Back</button>
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
