
# 🎓 College Peer Matchmaker

An intelligent web-based platform that connects students with suitable peers for collaborative learning, mentorship, or study partnerships — based on interests, budgets, ratings, and compatibility scores.

Built with **Node.js (Express)**, **MongoDB**, and **Vanilla HTML/CSS/JavaScript**, this system uses **custom DSA-based algorithms** (Similarity Matching + Graph-Based Greedy Matching) to find the best peer matches.

* * *

## Features

*   **Smart Matching System**
*   Computes compatibility scores between students and peers.
*   Uses hybrid algorithms combining **similarity-based** and **graph-based greedy** matching.
*   **Real-Time Peer Recommendations**
*   Instantly displays the best matches upon student registration.
*   **Persistent Sessions**
*   Past matches and session data are **saved and reloaded** automatically when the web app refreshes.
*   **Match Breakdown**
*   Displays detailed match reasoning (e.g., interests, budget, and rating similarity).
*   **MongoDB Integration**
*   Stores Students, Peers, and Session data efficiently.
*   **Simple Frontend**
*   Lightweight HTML, CSS, and JS frontend for ease of use.

* * *

## Tech Stack

| Layer | Technology | |-------|-------------| | Frontend | HTML, CSS, JavaScript | | Backend | Node.js (Express Framework) | | Database | MongoDB (Mongoose ODM) | | Matching Algorithms | DSA-based Similarity Matching & Graph-based Greedy Matching |

* * *

## Algorithm Overview

### 1️⃣ Similarity Matching

Compares:

*   Interests
*   Budget range
*   Ratings

Calculates a **normalized score (0–1)** using weighted attributes.

### 2️⃣ Graph-Based Greedy Matching

*   Treats students and peers as graph nodes.
*   Edges represent compatibility scores.
*   Greedily matches pairs to maximize total compatibility while avoiding duplicates.

* * *

## Project Setup

### 1\. Clone the Repository

\`\`\`bash git clone https://github.com//college-peer-matchmaker.git cd college-peer-matchmaker

2.  Install Dependencies npm install
    
3.  Configure MongoDB
    
    Create a .env file in the root directory and add your MongoDB URI:
    
    MONGO\_URI=mongodb+srv://:@cluster.mongodb.net/peer-match PORT=5000
    
4.  Run the Server npm start
    
    Your backend will start on http://localhost:5000
    
5.  Access the Frontend
    
    Open index.html from the public folder in your browser or serve it via a local static server.
    

🗂️ Folder Structure college-peer-matchmaker/

\-models/

```
 Student.js
  Peer.js
  Session.js

```

\-routes/

```
     matchRoutes.js

```

public/

```
index.html
style.css
script.js

```

server.js

package.json

README.md

* * *

💾 Data Models

Student { name: String, interest: String, rangeBudget: Number, rating: Number }

Peer { name: String, expertise: String, charges: Number, rating: Number }

Session { studentId: ObjectId, peerId: ObjectId, score: Number, details: Object }

## Tech Used: 

<img src="https://img.shields.io/badge/HTML-%23E34F26.svg?logo=html5&logoColor=white"> 
<img src="https://img.shields.io/badge/JavaScript-F7DF1E?logo=javascript&logoColor=000"> 
<img src="https://img.shields.io/badge/CSS-1572B6?logo=css3&logoColor=fff"> 
<img src="https://img.shields.io/badge/MongoDB-%234ea94b.svg?logo=mongodb&logoColor=white"> 
<img src="https://img.shields.io/badge/Node.js-6DA55F?logo=node.js&logoColor=white"> 



