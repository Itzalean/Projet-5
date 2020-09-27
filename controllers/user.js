const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const User = require('../models/User');

exports.signup = (req, res, next) => {
    // Chiffrement + sel pour le mot de passe
	bcrypt.hash(req.body.password, 12)
		.then(hash => {
			const user = new User({
				email: req.body.email,
				password: hash
			});
			user.save()
				.then(() => res.status(201).json({message: 'utilisateur créé.'}))
				.catch(error => {
                    res.statusMessage = error.message;
                    res.status(801).send();
                });
		})
		.catch(error => res.status(500).send());
};

exports.login = (req, res, next) => {
	User.findOne({ email: req.body.email })
		.then(user => {
            // Utilisateur inconnu
			if (!user) {
				return res.status(401).send();
            }
            // Utilisateur verrouillé (au moins 3 mots de passe invalides d'affilée)
            if (user.attempts >= 3) {
                res.statusMessage = 'User locked.';
                return res.status(800).send();
            }
			bcrypt.compare(req.body.password, user.password)
				.then(valid => {
					if (!valid) {
                        // Màj compteur de mots de passe erronés
                        user.attempts++;
                        user.updateOne({ attempts: user.attempts })
                            .then(() => {console.log('Mdp invalide : ' + user.email + ' => ' + user.attempts)})
                            .catch(error => console.log(error))
						return res.status(401).send();
					}
                    // Remise à zéro du compteur quand le mot de passe est correct
                    user.updateOne({attempts: 0})
                        .then()
                        .catch(error => console.log(error))
					res.status(200).json({
						userId: user._id,
						token: jwt.sign(
							{ userId: user._id },
							privateKey,
							{ expiresIn: '1h'}
						)
					});
				})
				.catch(error => res.status(500).json({ error }));
			})
		.catch(error => res.status(500).json({ error }));
};
