require("dotenv").config();
const request = require("request");
const express = require("express");
const qs = require("querystring");
const app = express();

app.use(express.static("."));

app.use(function(req, res, next) {
	res.setHeader("Access-Control-Allow-Origin", "*");
	res.header("Access-Control-Allow-Credentials", true);
	res.header(
		"Access-Control-Allow-Headers",
		"Origin, X-Requested-With, Content-Type, Content-length, Accept, x-access-token"
	);
	res.header("Access-Control-Allow-Methods", "POST, GET, PUT, DELETE, OPTIONS");
	next();
});

app.get("/auth", (req, res) => {
	res.redirect(
		"https://accounts.spotify.com/authorize?" +
			qs.stringify({
				response_type: "code",
				client_id: process.env.CLIENT_ID,
				redirect_uri: `${process.env.SERVER_URL}/redirect`
			})
	);
});

app.get("/redirect", (req, res) => {
	const code = req.url.match(/code=([\w\d-_.]+)/)[1];
	const base64Token = `${process.env.CLIENT_ID}:${process.env.CLIENT_SECRET}`;
	request(
		{
			url: "https://accounts.spotify.com/api/token",
			method: "POST",
			form: {
				grant_type: "authorization_code",
				code: code,
				redirect_uri: `${process.env.SERVER_URL}/redirect`
			},
			json: true,
			headers: {
				Authorization: `Basic ${new Buffer(base64Token).toString("base64")}`
			}
		},
		(err, response, body) => {
			res.redirect(`${process.env.APP_URL}?${qs.stringify(body)}`);
		}
	);
});

// Auth with code already
app.get("/authWithCode", (req, res) => {
	const code = req.query.code;
	const base64Token = `${process.env.CLIENT_ID}:${process.env.CLIENT_SECRET}`;
	if (code) {
		request(
			{
				url: "https://accounts.spotify.com/api/token",
				method: "POST",
				form: {
					grant_type: "authorization_code",
					code: code,
					redirect_uri:
						"https://lkicoiogfdfdbpbpmdekaibchkomngik.chromiumapp.org/spotify"
				},
				json: true,
				headers: {
					Authorization: `Basic ${new Buffer(base64Token).toString("base64")}`
				}
			},
			(err, response, body) => {
				res.send(`${qs.stringify(body)}`);
			}
		);
	} else {
		res.send("That didnt work. No code");
	}
});

app.get("/refresh", (req, res) => {
	const base64Token = `${process.env.CLIENT_ID}:${process.env.CLIENT_SECRET}`;

	request(
		{
			url: "https://accounts.spotify.com/api/token",
			method: "post",
			form: {
				grant_type: "refresh_token",
				refresh_token: req.query.refresh_token
			},
			headers: {
				Authorization: `Basic ${new Buffer(base64Token).toString("base64")}`
			}
		},
		(err, response, body) => {
			res.send(body);
		}
	);
});

app.get("/transferToPlayer", (req, res) => {
	const access_token = req.query.token;
	const device_ids_body = req.query.device_id;
	console.log("Token: ", access_token);
	console.log("Device_id: ", device_ids_body);
	request(
		{
			url: "https://api.spotify.com/v1/me/player",
			method: "put",
			body: JSON.stringify({ device_ids: [device_ids_body] }),
			headers: {
				Authorization: `Bearer ${access_token}`
			}
		},
		(err, response, body) => {
			res.send(body);
		}
	);
});

app.listen(process.env.PORT || "3400");
