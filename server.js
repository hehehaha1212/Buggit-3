const express = require('express');
const path = require('path');

const app = express();
const PORT = 3000;

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

let requestState = {
  requestedBy: 'student',
  approved: false
};

app.post('/api/request/create', (req, res) => {
  requestState = req.body;
  res.json({ success: true });
});

app.get('/lab', (req, res) => {
  if (!requestState.approved) {
    return res.status(403).send('Faculty approval required to access this lab.');
  }
  res.redirect('/bug-found');
});

app.get('/bug-found', (req, res) => {
  res.send(`
    <h1>🐞 Bug Found!</h1>
    <p>You gained access by manipulating server-side state via client-controlled input.</p>
  `);
});

app.listen(PORT, () => {
  console.log(`Campus Resource Booking running at http://localhost:${PORT}`);
});
