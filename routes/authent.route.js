const {Router} = require('express');
const User = require('../mongo_models/User');
const router = Router();
const bcrypt = require('bcryptjs');
const {check, validationResult } = require('express-validator');
const jwt = require('jsonwebtoken');
const config = require('config');


// register route
router.post('/register',

    [
        check('name', 'Provide valid name').not().isEmpty(),
        check('email', 'Incorrect email').isEmail(),
        check('password', 'Password minimum length is 8 symbols').isLength({min:8})
    ],

    async (req, res) => {
    try {
        const result = validationResult(req);
        const hasErrors = !result.isEmpty();
        if (hasErrors) {
            return res.status(400).json({errors: result.array(),
                message: 'Invalid data while registration!'})
        }

        const {name, email, password} = req.body;

        const applicantUser = await User.findOne({email:email});

        if (applicantUser) {
           return  res.status(400).json({message: 'This user already exists!'})
        }

        const cryptedPassword = bcrypt.hash(password, 5);
        const user = new User({name:name, email:email, password:cryptedPassword});

        await user.save();

        res.status(201).json({message: 'User has been created'})

    }catch(e){
        res.status(500).json({message: 'Something went wrong!'})
    }


});

router.post('/login',
    [
        check('name', 'Provide valid name').not().isEmpty(),
        check('email', 'Provide correct email').isEmail(),
        check('password', 'Provide your password').exists()
    ],

    async (req, res) => {
    try {
        const result = validationResult(req);
        const hasErrors = !result.isEmpty();
        if (hasErrors) {
            return res.status(400).json({errors: result.array(),
                message: 'Invalid data while registration!'})
        }

        const {name, email, password} = req.body;

        const user = await User.findOne({email:email});
        if (!user) {
            return res.status(400).json({message:'User nor found!'})
        }

        const matchingPassword = await bcrypt.compare(password, user.password);
        if (!matchingPassword) {
            return res.status(400).json({message: 'Password is wrong!'})
        }

        const payload = {
            id: user.id,
            name: user.name,
            email: user.email
        };
        const token = jwt.sign(payload, config.get('accessTokenSecret'), {expiresIn: '1h'});
        res.status(200).json({token, id:user.id})

    }catch(e){
        res.status(500).json({message: 'Something went wrong!'})
    }



});