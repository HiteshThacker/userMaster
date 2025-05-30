// middlewares/authMiddleware.js
const jwt = require("jsonwebtoken");

exports.verifyToken = (req, res, next) => {

  const token = req.cookies?.uid 
    // || (req.headers.authorization &&
    //   req.headers.authorization.split(" ")[1]); // "Bearer <token>"

  if (!token) {
    return res.status(401).render("login", { error: "Please log in first" });
  }

  try {
    // 2.  Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    // console.log(decoded)

    // 3.  Stash the decoded payload (e.g. { id, email }) on req for downstream use
    req.user = decoded;
    next();
  } catch (err) {
    
    return res.status(401).render("login", { error: "Session expired – log in again" });
  }
};
