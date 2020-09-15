const Sauce = require('../models/Sauce');
const fs = require ('fs');

exports.createSauce = (req, res, next) => {
	const sauceObject = JSON.parse(req.body.sauce);
	delete sauceObject._id;
	const sauce = new Sauce({
		...sauceObject,
		imageUrl: `${req.protocol}://${req.get("host")}/images/${req.file.filename}`
	});
	sauce.save()
		.then(() => res.status(201).json({ message: "Sauce créée"}))
		.catch(error => res.status(400).json({ error }));
};

exports.updateSauce = (req, res, next) => {
	const sauceObject = req.file ? 
		{
			...JSON.parse(req.body.sauce),
			imageUrl: `${req.protocol}://${req.get("host")}/images/${req.file.filename}`
		} : { ...req.body };
	Sauce.updateOne({ _id: req.params.id}, { ...sauceObject, _id: req.params.id })
		.then(() => res.status(200).json({ message: "Sauce modifiée."}))
		.catch(error => res.status(400).json({ error }));
};

exports.deleteSauce = (req, res, next) => {
	Sauce.findOne({ _id: req.params.id})
		.then(sauce => {
			const filename = sauce.imageUrl.split('/images/')[1];
			fs.unlink(`images/${filename}`, () => {
				Sauce.deleteOne({ _id: req.params.id})
					.then(() => res.status(200).json({ message: "Sauce supprimée."}))
					.catch(error => res.status(400).json({ error }));
			});
		})
		.catch(error => res.status(500).json({ error }));
};

exports.getSauce = (req, res, next) => {
	Sauce.findOne({ _id: req.params.id})
		.then(sauce => res.status(200).json(sauce))
		.catch(error => res.status(404).json({ error }));
};

exports.getAll = (req, res, next) => {
	Sauce.find()
		.then(sauces => res.status(200).json(sauces))
		.catch(error => res.status(400).json({ error }));
};

exports.likeSauce = (req, res, next) => {
	Sauce.findOne({ _id: req.params.id})
		.then(sauce => {
			switch (req.body.like) {
				case -1:
					sauce.usersDisliked.push(req.body.userId);
					sauce.dislikes++;
					break;
				case 1:
					sauce.usersLiked.push(req.body.userId);
					sauce.likes++;
					break;
				default:
					let index = sauce.usersLiked.indexOf(req.body.userId);
					if (index >= 0) {
						sauce.usersLiked.splice(index);
						sauce.likes--;
					} else {
						index = sauce.usersDisliked.indexOf(req.body.userId);
						if (index >= 0) {
							sauce.usersDisliked.splice(index);
							sauce.dislikes--;
						}
					}
			}
			Sauce.updateOne({ _id: req.params.id}, {
				_id: req.params.id,
				likes: sauce.likes,
				dislikes: sauce.dislikes,
				usersLiked: sauce.usersLiked,
				usersDisliked: sauce.usersDisliked
				})
					.then(() => res.status(200).json({ message: "Sauce modifiée."}))
					.catch(error => res.status(400).json({ error }));
		})
		.catch(error => res.status(400).json({ error }));
};
