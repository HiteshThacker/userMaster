const router = require("express").Router();
const userCon = require('../controllers/userCon');
const {verifyToken}=require('../middlewares/auth');


router.get("/",userCon.login);
router.post("/",userCon.loginUser);
router.get("/reg",userCon.signup);
router.post("/reg",userCon.signupUser);

router.get("/verify-email",userCon.verifyEmail);
router.post("/verify-email",userCon._verifyEmail);
router.post("/verify-code",userCon.verifyCode);


router.get("/profile",verifyToken,userCon.getprofile);
router.post("/profile",verifyToken,userCon.updateUser);

router.get("/logout",userCon.logout);

module.exports=router;