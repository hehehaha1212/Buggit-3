const express = require('express');
const path = require('path');
const crypto = require('crypto');
const session = require('express-session');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

/* =========================
   SESSION SETUP
========================= */
app.use(
  session({
    name: 'buggit-session',
    secret: crypto.randomBytes(32).toString('hex'),
    resave: false,
    saveUninitialized: true,
    cookie: {
      httpOnly: true,
      sameSite: 'lax'
    }
  })
);

/* =========================
   LEVEL 1
========================= */

// Prototype exploit beacon
app.post('/api/report', (req, res) => {
  req.session.level1Solved = true;
  res.json({ status: 'ok' });
});

// ACCESS FEATURE button
app.post('/unlock', (req, res) => {
  if (!req.session.level1Solved) {
    return res.status(403).json({ error: 'denied' });
  }

  req.session.level2Allowed = true;
  res.json({ next: '/level2' });
});

/* =========================
   LEVEL 2
========================= */

app.post('/api/request/create', (req, res) => {
  // student controls server-side state
  if (req.body.approved === true) {
    req.session.bugFoundAllowed = true;
  }

  res.json({ success: true });
});

app.get('/lab', (req, res) => {
  if (!req.session.bugFoundAllowed) {
    return res
      .status(403)
      .send('Faculty approval required to access this lab.');
  }

  res.redirect('/bug-found');
});

/* =========================
   BUG FOUND
========================= */

app.get('/bug-found', async (req, res) => {
  if (!req.session.bugFoundAllowed) {
    return res.status(403).send('Nothing to see here.');
  }
  req.session.bugFoundAllowed = false;
  const token = req.session.challengeToken;

  if (!token) {
    return res.status(401).json({ message: "No challenge token" });
  }

  try {
    const response = await fetch(`${process.env.EXTERNAL_SOLVE_URL}/api/solved`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": token,
      },
      body: JSON.stringify({
        questionId: process.env.QUESTION_ID,
      }),
    });

    const data = await response.json();

    return res.send(`
    <h1>🐞 Bug Found!</h1>
    <p>You chained multiple vulnerabilities across system boundaries.</p>
    <p><strong>BUGGIT COMPLETE.</strong></p>
  `);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Solve failed" });
  }

});

/* =========================
   PAGE ROUTES
========================= */

app.get('/', (req, res) => {

  res.redirect('/level1');
});

app.get('/level1', (req, res) => {
  res.sendFile(path.join(__dirname, 'public/level1/index.html'));
});

app.get('/level2', (req, res) => {
  if (!req.session.level2Allowed) {
    return res.status(403).send('Solve Level 1 first.');
  }


  // consume access
  req.session.level2Allowed = false;

  res.sendFile(path.join(__dirname, 'protected/level2/index.html'));
});


app.post("/register-token", express.json(), (req, res) => {
  const { token } = req.body;

  if (!token) {
    return res.status(400).json({ message: "Token missing" });
  }

  // Store token in session
  req.session.challengeToken = token;

  console.log("Token stored in session");
  res.json({ ok: true });
});

app.get('/favicon.ico', (req, res) => res.status(204).end());

app.listen(PORT, () => {
  console.log(`BUGGIT running at http://localhost:${PORT}`);
});