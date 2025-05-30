const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { PrismaClient } = require("@prisma/client");
const nodemailer = require('nodemailer');
const crypto = require('crypto');
const codes = new Map();
const prisma = new PrismaClient();

async function login(req,res) {
    return res.render("login",{ error: null });  
}

async function loginUser(req,res) {
    const { email, password } = req.body;

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) return res.render("login",{ error: "user already exists" });

    if (!await bcrypt.compare(password, user.password))
    {return res.render("login",{ error: "Invalid credentials" });}

    const token = jwt.sign({id: user.id, email: user.email, name:user.name}, process.env.JWT_SECRET,{
        expiresIn: "1d"
    });
    res.cookie("uid",token,{
        expires: new Date(Date.now() + 24 * 60 * 60 * 1000)
    });
    return res.redirect("/profile");  
}


async function verifyEmail(req,res) {
    return res.render("verifyEmail",{ error: null });
}

async function _verifyEmail(req,res) {
    const { email } = req.body;
    const code = crypto.randomInt(100000, 999999).toString();

    // Save code and timestamp
    codes.set(email, { code, expires: Date.now() + 10 * 60 * 1000 }); // 10 min expiry

    // Send email
    const transporter = nodemailer.createTransport({
        service: "gmail",
        auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
        },
    });
    await transporter.sendMail({
        from: '"user-verify"<no-reply@login.com>',
        to: email,
        subject: 'Email Verification',
        html: `<p>Your verification code is: <b>${code}</b></p>`
    });

    res.render("enterCode", { email ,error: null });
}

async function verifyCode(req,res) {
    const { email, code } = req.body;
    const data = codes.get(email);

    if (!data || data.code !== code || Date.now() > data.expires) {
        return res.render("enterCode", { email, error: "Invalid or expired code" });
    }

    // Set verified flag in session or temp DB
    res.cookie("sid",code,{
        expires: new Date(Date.now() + 20 * 60 * 1000)
    });
    req.session.verifiedEmail = email;


    codes.delete(email); // optional

    res.redirect("/reg");
}

async function signup(req,res) {

    if (req.cookies?.sid){
        
        return res.render("signup",{email:req.session.verifiedEmail , error: null });
    }

    return res.redirect("/verify-email");
    
}

async function signupUser(req,res) {

    const { name,number, password, cpassword } = req.body;
    const email=req.session.verifiedEmail ;

    try {
        if (!name || !email || !password || !cpassword) {
        return res.render("signup", { email:req.session.verifiedEmail ,error: "All fields are required" });
        }

        if (password !== cpassword) {
        return res.render("signup", {email:req.session.verifiedEmail , error: "Passwords must match" });
        }

        // Check if email already exists
        const existingUser = await prisma.user.findUnique({ where: { email } });
        if (existingUser) {
        return res.render("signup", {email:req.session.verifiedEmail ,error: "User already exists" });
        }

        // Hash password
        const hashedPassword = await bcrypt.hash(password, 10);

        // Create user
        const newUser = await prisma.user.create({
        data: {
            name,
            number,
            email,
            password: hashedPassword
        }
        });

        // Generate JWT
        const token = jwt.sign({ id: newUser.id, email: newUser.email, name:newUser.name}, process.env.JWT_SECRET, {
            expiresIn: "1d"
        });

        // Store in cookie
        res.cookie("uid", token, {
            expires: new Date(Date.now() + 24 * 60 * 60 * 1000)
        });

        res.clearCookie('connect.sid');
        res.clearCookie('sid');


        return res.redirect("/profile");

    } catch (error) {
        console.error(error);
        return res.render("login", { error: error });
    }


}

async function logout(req,res) {
    res.clearCookie("uid");
    return res.status(200).redirect("/");
}

async function getprofile(req,res) {
    if(req.user){
        const user = await prisma.user.findUnique({
            where: { id: req.user.id },           
        });
        if (!user) return res.status(404).send("User not found");

        res.render("profile", { user, message: null });
    }
    else{
        res.render("login");
    }
}

async function updateUser(req,res) {
    const { name, number } = req.body;
    try {
        const user = await prisma.user.update({
        where: { email: req.user.email },           
        data: { name, number},
        });
        res.render("profile", { user, message: "Profile updated successfully!" });
    } catch (err) {
        res.status(500).send("Server error");
    }
}



module.exports={
    loginUser,
    login,
    verifyEmail,
    _verifyEmail,
    verifyCode,
    signup,
    signupUser,
    logout,
    getprofile,
    updateUser
}
