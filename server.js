import express from "express";
import fetch from "node-fetch";
import dotenv from "dotenv";

dotenv.config();

const app = express();

app.set("views", "./views");
app.set("view engine", "pug");

app.use(express.static("public"));

const redirect_uri = "http://localhost:3000/callback";
const client_id = process.env.CLIENT_ID;
const client_secret = process.env.CLIENT_SECRET;
const ticketmaster_api_key = process.env.TICKETMASTER_API_KEY;

global.access_token;

app.get("/", function (req, res) {
  res.render("index");
});

app.get("/authorize", (req, res) => {
  var auth_query_parameters = new URLSearchParams({
    response_type: "code",
    client_id: client_id,
    scope: "user-library-read playlist-read-private user-follow-read",
    redirect_uri: redirect_uri,
  });

  res.redirect(
    "https://accounts.spotify.com/authorize?" + auth_query_parameters.toString()
  );
});

app.get("/callback", async (req, res) => {
  const code = req.query.code;

  var body = new URLSearchParams({
    code: code,
    redirect_uri: redirect_uri,
    grant_type: "authorization_code",
  });

  const response = await fetch("https://accounts.spotify.com/api/token", {
    method: "post",
    body: body,
    headers: {
      "Content-type": "application/x-www-form-urlencoded",
      Authorization:
        "Basic " +
        Buffer.from(client_id + ":" + client_secret).toString("base64"),
    },
  });

  const data = await response.json();
  global.access_token = data.access_token;

  res.redirect("/dashboard");
});

async function getData(endpoint) {
  const response = await fetch("https://api.spotify.com/v1" + endpoint, {
    method: "get",
    headers: {
      Authorization: "Bearer " + global.access_token,
    },
  });

  const data = await response.json();
  // console.log(data);
  return data;
}


async function getArtistEvents(artistName) {
    const response = await fetch(`https://app.ticketmaster.com/discovery/v2/events.json?classificationNmae=music&keyword=${artistName}&apikey=${ticketmaster_api_key}`, {
      method: "get",
    });
  
    const eventsData = await response.json();

    return eventsData;

  }
  
  async function getArtistEventsForAll(followedArtists) {
    const artistEvents = [];
  
    for (const artist of followedArtists) {
      // console.log(artist.name)
      const eventsResponse = await getArtistEvents(artist.name);
   
      if (eventsResponse._embedded && eventsResponse._embedded.events.length > 0) {
        
        const events = eventsResponse._embedded.events;
        for (const event of events) {
          // Extract city and country information if available
          const city = event._embedded?.venues[0]?.city?.name || ' ';
          const country = event._embedded?.venues[0]?.country?.name || ' ';



          // Extract and structure relevant event data
          const eventData = {
            artistName: artist.name,
            eventName: event.name,
            eventDate: event.dates.start.localDate, // Assuming date is in ISO 8601 format
            ticketLink: event.url,
            city: city,
            country: country,
          };
          // console.log(`EVENT DATA: ${eventData}`)
          artistEvents.push(eventData);
        }
      }else {
        // No events found for this artist, continue to the next one
        continue;
      }
    }
  
    // Sort events by date
    artistEvents.sort((a, b) => new Date(a.eventDate) - new Date(b.eventDate));

    return artistEvents;
  }



app.get("/dashboard", async (req, res) => {
  const userInfo = await getData("/me");
  const followingResponse = await getData('/me/following?type=artist');
  const followedArtists = followingResponse.artists.items;
  // console.log(followedArtists);
  

  const artistEvents = await getArtistEventsForAll(followedArtists);
  // console.log(artistEvents);

  res.render("dashboard", { user: userInfo, artistEvents });

//   const events = await getEvents();
//   console.log(events);
//   // console.log(`Following ${following.artists.items.name}`);

//   res.render("dashboard", { user: userInfo, tracks: tracks.items, playlists: playlists.items, following: following.artists.items });
});

app.get("/recommendations", async (req, res) => {
  const artist_id = req.query.artist;
  const track_id = req.query.track;

  const params = new URLSearchParams({
    seed_artist: artist_id,
    seed_genres: "rock",
    seed_tracks: track_id,
  });

  const data = await getData("/recommendations?" + params);
  res.render("recommendation", { tracks: data.tracks });
});

let listener = app.listen(3000, function () {
  console.log(
    "Your app is listening on http://localhost:" + listener.address().port
  );
});
