// controllers/matchController.js
const matchStudents = async (req, res) => {
  try {
    // your matching algorithm logic here
    res.json({ message: "Matching done successfully!" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server Error" });
  }
};

module.exports = { matchStudents };
