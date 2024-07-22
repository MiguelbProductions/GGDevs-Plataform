const express = require('express');
const bodyParser = require('body-parser');
const session = require('express-session');
const cookieParser = require('cookie-parser');
const MongoStore = require('connect-mongo');
const moment = require('moment');
const bcrypt = require("bcrypt");
const multer = require('multer');
const path = require('path');

const app = express();
const port = 5000;

require('dotenv').config();

const countries = [
  "Afghanistan", "Albania", "Algeria", "American Samoa", "Andorra",
  "Angola", "Anguilla", "Antarctica", "Antigua and Barbuda", "Argentina",
  "Armenia", "Aruba", "Australia", "Austria", "Azerbaijan",
  "Bahamas", "Bahrain", "Bangladesh", "Barbados", "Belarus",
  "Belgium", "Belize", "Benin", "Bermuda", "Bhutan",
  "Bolivia", "Bosnia and Herzegowina", "Botswana", "Bouvet Island", "Brazil",
  "British Indian Ocean Territory", "Brunei Darussalam", "Bulgaria", "Burkina Faso", "Burundi",
  "Cambodia", "Cameroon", "Canada", "Cape Verde", "Cayman Islands",
  "Central African Republic", "Chad", "Chile", "China", "Christmas Island",
  "Cocos (Keeling) Islands", "Colombia", "Comoros", "Congo", "Congo, the Democratic Republic of the",
  "Cook Islands", "Costa Rica", "Cote d'Ivoire", "Croatia (Hrvatska)", "Cuba",
  "Cyprus", "Czech Republic", "Denmark", "Djibouti", "Dominica",
  "Dominican Republic", "East Timor", "Ecuador", "Egypt", "El Salvador",
  "Equatorial Guinea", "Eritrea", "Estonia", "Ethiopia", "Falkland Islands (Malvinas)",
  "Faroe Islands", "Fiji", "Finland", "France", "France Metropolitan",
  "French Guiana", "French Polynesia", "French Southern Territories", "Gabon", "Gambia",
  "Georgia", "Germany", "Ghana", "Gibraltar", "Greece",
  "Greenland", "Grenada", "Guadeloupe", "Guam", "Guatemala",
  "Guinea", "Guinea-Bissau", "Guyana", "Haiti", "Heard and Mc Donald Islands",
  "Holy See (Vatican City State)", "Honduras", "Hong Kong", "Hungary", "Iceland",
  "India", "Indonesia", "Iran (Islamic Republic of)", "Iraq", "Ireland",
  "Israel", "Italy", "Jamaica", "Japan", "Jordan",
  "Kazakhstan", "Kenya", "Kiribati", "Korea, Democratic People's Republic of", "Korea, Republic of",
  "Kuwait", "Kyrgyzstan", "Lao, People's Democratic Republic", "Latvia", "Lebanon",
  "Lesotho", "Liberia", "Libyan Arab Jamahiriya", "Liechtenstein", "Lithuania",
  "Luxembourg", "Macau", "Macedonia, The Former Yugoslav Republic of", "Madagascar", "Malawi",
  "Malaysia", "Maldives", "Mali", "Malta", "Marshall Islands",
  "Martinique", "Mauritania", "Mauritius", "Mayotte", "Mexico",
  "Micronesia, Federated States of", "Moldova, Republic of", "Monaco", "Mongolia", "Montserrat",
  "Morocco", "Mozambique", "Myanmar", "Namibia", "Nauru",
  "Nepal", "Netherlands", "Netherlands Antilles", "New Caledonia", "New Zealand",
  "Nicaragua", "Niger", "Nigeria", "Niue", "Norfolk Island",
  "Northern Mariana Islands", "Norway", "Oman", "Pakistan", "Palau",
  "Panama", "Papua New Guinea", "Paraguay", "Peru", "Philippines",
  "Pitcairn", "Poland", "Portugal", "Puerto Rico", "Qatar",
  "Reunion", "Romania", "Russian Federation", "Rwanda", "Saint Kitts and Nevis",
  "Saint Lucia", "Saint Vincent and the Grenadines", "Samoa", "San Marino", "Sao Tome and Principe",
  "Saudi Arabia", "Senegal", "Seychelles", "Sierra Leone", "Singapore",
  "Slovakia (Slovak Republic)", "Slovenia", "Solomon Islands", "Somalia", "South Africa",
  "South Georgia and the South Sandwich Islands", "Spain", "Sri Lanka", "St. Helena", "St. Pierre and Miquelon",
  "Sudan", "Suriname", "Svalbard and Jan Mayen Islands", "Swaziland", "Sweden",
  "Switzerland", "Syrian Arab Republic", "Taiwan, Province of China", "Tajikistan", "Tanzania, United Republic of",
  "Thailand", "Togo", "Tokelau", "Tonga", "Trinidad and Tobago",
  "Tunisia", "Turkey", "Turkmenistan", "Turks and Caicos Islands", "Tuvalu",
  "Uganda", "Ukraine", "United Arab Emirates", "United Kingdom", "United States",
  "United States Minor Outlying Islands", "Uruguay", "Uzbekistan", "Vanuatu", "Venezuela",
  "Vietnam", "Virgin Islands (British)", "Virgin Islands (U.S.)", "Wallis and Futuna Islands", "Western Sahara",
  "Yemen", "Yugoslavia", "Zambia", "Zimbabwe"
];

const sessionConfig = {
  secret: process.env.SECRET_SESSION_KEY,
  resave: false,
  saveUninitialized: true,
  cookie: {
    secure: process.env.NODE_ENV === 'production',
    sameSite: process.env.NODE_ENV === "production" ? 'none' : 'lax',
  },
  store: MongoStore.create({
    mongoUrl: process.env.MONGO_URI
  })
};

app.engine("html", require("ejs").renderFile);
app.set("view engine", "html");
app.use("/public", express.static(path.join(__dirname, "public")));
app.use("/uploads", express.static(path.join(__dirname, "uploads")));
app.use("/node_modules", express.static(path.join(__dirname, "node_modules")));
app.use("/src", express.static(path.join(__dirname, "src")));
app.set("views", path.join(__dirname, "views"));
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.json());
app.use(cookieParser());
app.use(session(sessionConfig));

const { MongoClient, ObjectId } = require('mongodb');
const client = new MongoClient(process.env.MONGO_URI);

async function connectDB() {
  try {
      await client.connect();

      return client.db('CraftersFund');
  } catch (err) {
      console.error("Failed to connect to MongoDB", err);
      process.exit(1);
  }
}

// ============= Users ============= //

app.get('/login', async (req, res) => {
  return res.render("main/auth/login.html", { user: req.session.user, pageName: "Login", error: ""});
});

app.get('/register', async (req, res) => {
  return res.render("main/auth/register.html", { user: req.session.user, pageName: "Register", countries: countries });
});

app.get('/check-email', async (req, res) => {
  const { email } = req.query;

  try {
      const db = await connectDB();
      const collection = db.collection('users');
      const user = await collection.findOne({ email: email });

      if (user) {
          res.json({ isAvailable: false });
      } else {
          res.json({ isAvailable: true });
      }
  } catch (err) {
      console.error("Error accessing database", err);
      res.status(500).json({ error: "Internal server error" });
  }
});

app.post('/loginUser', async (req, res) => {
  const { email, password } = req.body;
  
  try {
      const db = await connectDB();
      const collection = db.collection('users');
      const user = await collection.findOne({ email: email });

      if (user) {
        const passwordMatch = await bcrypt.compare(password, user.password);

        if (passwordMatch) {
          req.session.user = user;
          res.redirect('/');
        } else res.render('main/auth/login.html', { user: req.session.user, pageName: "Login", error: 'Password is incorrect' });

        return
      } else {
        return res.render('main/auth/login.html', { user: req.session.user, pageName: "Login", error: 'No user found with this email' });
        return
      }
    } catch (err) {
      console.error("Server Error", err);
      return res.render('main/auth/login.html', { user: req.session.user, pageName: "Login", error: 'Server error, please try again later.' });
  }
});

app.post('/registerUser', async (req, res) => {
  var {
    name, username, email, password, gender, role, phone, dob, address,
    cardNumber, cardName, cardCountry, zipCode, expDate, cvv, profileIcon
  } = req.body;

  const hashedPassword = await bcrypt.hash(password, 10);

  if (!profileIcon || profileIcon == "") profileIcon = "public\\assets\\img\\default-avatar.png"

  const user = {
    name, 
    username,
    email, 
    password: hashedPassword,
    role,
    profileIcon,
    personalInfo: {
      gender, 
      phone, 
      dateOfBirth: dob, 
      address
    },
    billingInfo: {
      cardNumber, 
      cardName, 
      cardCountry, 
      zipCode, 
      expDate, 
      cvv
    }
  };

  try {
    const db = await connectDB();
    const collection = db.collection('users');
    await collection.insertOne(user);
    res.json({"info": "Registration complete"});
  } catch (err) {
    console.error("Error saving user to database:", err);
    res.status(500).json({"error": "Internal server error"});
  }
});

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
      cb(null, 'uploads/');
  },
  filename: function (req, file, cb) {
      cb(null, file.fieldname + '-' + Date.now() + path.extname(file.originalname));
  }
});

const upload = multer({ storage: storage });

app.post('/update-profile', upload.single('profileIcon'), async (req, res) => {
  const { userId, name, title, location, content, profileIcon, role, company, duration, school, degree, schoolDuration, schoolLocation } = req.body;
  
  if (!req.session.user) {
      return res.status(403).send('Unauthorized access');
  }

  try {
      const db = await connectDB();
      const collection = db.collection('users');

      const updateData = {
          name,
          title,
          location,
          about: content,
          profileIcon
      };

      if (req.file) {
          updateData.profileIcon = req.file.path;
      }

      if (role && role.length) {
          let parsedRole = Array.isArray(role) ? role : JSON.parse(role);
          let parsedCompany = Array.isArray(company) ? company : JSON.parse(company);
          let parsedDuration = Array.isArray(duration) ? duration : JSON.parse(duration);
          
          updateData.experience = parsedRole.map((r, index) => ({
              role: r,
              company: parsedCompany[index],
              duration: parsedDuration[index]
          }));
      }

      if (school && school.length) {
          let parsedSchool = Array.isArray(school) ? school : JSON.parse(school);
          let parsedDegree = Array.isArray(degree) ? degree : JSON.parse(degree);
          let parsedSchoolDuration = Array.isArray(schoolDuration) ? schoolDuration : JSON.parse(schoolDuration);
          let parsedSchoolLocation = Array.isArray(schoolLocation) ? schoolLocation : JSON.parse(schoolLocation);
          
          updateData.education = parsedSchool.map((s, index) => ({
              school: s,
              degree: parsedDegree[index],
              duration: parsedSchoolDuration[index],
              location: parsedSchoolLocation[index]
          }));
      }

      await collection.updateOne({ _id: new ObjectId(userId) }, { $set: updateData });

      const updatedUser = await collection.findOne({ _id: new ObjectId(userId) });
      req.session.user = updatedUser;

      res.redirect(req.get('referer'));
    } catch (error) {
      console.error('Failed to update profile:', error);
      res.status(500).send('Internal server error');
  }
});

app.get('/Profile/:username', async (req, res) => {
  const username = req.params.username;

  try {
      var db = await connectDB();
      var usersCollection = db.collection('users');
      var user = await usersCollection.findOne({ username: username });

      if (!user) return res.render("main/500.html", { pageName: "500", error: "User not found"})

      var followersData = [];
      if (user.followers && user.followers.length > 0) {
          followersData = await usersCollection.find({
              _id: { $in: user.followers.map(id => new ObjectId(id)) }
          }).toArray();
      }

      if (req.session.user._id.toString() === user._id.toString() && (!user.title || !user.location)) {
        res.render('main/user/profileedit.html', { user: req.session.user, pageName: "UserEdit", pageUser: user });
      } else {
          res.render('main/user/profile.html', { user: req.session.user, pageName: "UserView", pageUser: user, followers: followersData });  
      }
  } catch (err) {
      console.error('Database error:', err);
      res.status(500).send('Database error');
  }
});


app.get('/Profile/Edit/:username', async (req, res) => {
  const username = req.params.username;

  try {
      var db = await connectDB();
      var usersCollection = db.collection('users');
      var user = await usersCollection.findOne({ username: username });

      if (!user) return res.render("main/500.html", { pageName: "500", error: "User not found"})

      res.render('main/user/profileedit.html', { user: req.session.user, pageName: "UserEdit", pageUser: user });
  } catch (err) {
      console.error('Database error:', err);
      res.status(500).send('Database error');
  }
});

app.get('/Wishlist', async (req, res) => {
  if (!req.session.user) {
    return res.redirect('/login');
  }

  const userId = req.session.user._id;

  try {
    const db = await connectDB();
    const projects = await db.collection('projects').find({
      wishlist: userId.toString()  
    }).toArray();

    projects.forEach(project => {
      project.isWishedByUser = project.wishlist.includes(userId.toString());
    });

    res.render('main/user/wishlist.html', {
      user: req.session.user,
      projects: projects,
      pageName: "Wishlist"
    });
  } catch (err) {
    console.error('Error fetching wishlist:', err);
    res.status(500).send('Internal server error');
  }
});



app.post('/follow', async (req, res) => {
  if (!req.session.user) return res.status(403).send('Not logged in');

  const targetUserId = req.body.targetUserId;
  const currentUserId = req.session.user._id;

  try {
      const db = await connectDB();
      const usersCollection = db.collection('users');

      const isFollowing = await usersCollection.findOne({
          _id: new ObjectId(targetUserId),
          followers: { $elemMatch: { $eq: currentUserId } }
      });

      if (isFollowing) {
          await usersCollection.updateOne(
              { _id: new ObjectId(targetUserId) },
              { $pull: { followers: currentUserId } }
          );
      } else {
          await usersCollection.updateOne(
              { _id: new ObjectId(targetUserId) },
              { $addToSet: { followers: currentUserId } }
          );

          const currentUser = await usersCollection.findOne({ _id: new ObjectId(currentUserId) });

            await addNotification(
                db,
                targetUserId, 
                `${currentUser.name} has started following you!`, 
                'new_follower',
                currentUser.profileIcon
            );
      }

      res.redirect(req.get('referer')); 
  } catch (err) {
      console.error('Database error:', err);
      res.status(500).send('Database error');
  }
});


app.get('/logout', (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      return console.log(err);
    }
    res.redirect('/login');
  });
});

// ============= Dashboard ============= //

app.get('/Dashboard/Tickets', async (req, res) => {
  if (!req.session.user) return res.redirect("/login");

  try {
      const db = await connectDB();
      const projectsCollection = db.collection('projects');
      const ticketsCollection = db.collection('tickets');
      let tickets;

      if (req.session.user.role === "Entrepreneur") {
          const projects = await projectsCollection.find({ ownerId: req.session.user._id }).toArray();
          const projectIds = projects.map(project => project._id);
          tickets = await ticketsCollection.find({ projectId: { $in: projectIds } }).toArray();
      } else {
          tickets = await ticketsCollection.find({ "user._id": req.session.user._id }).toArray();
      }

      const updatePromises = tickets.map(ticket => {
          if (!ticket.priority) {
              return ticketsCollection.updateOne(
                  { _id: ticket._id },
                  { $set: { priority: "Low" } }
              );
          }
          return null;
      }).filter(p => p !== null);

      await Promise.all(updatePromises);

      return res.render("dashboard/card-view.html", {
          user: req.session.user,
          pageName: "Dashboard",
          tickets: tickets,
      });
  } catch (err) {
      console.error("Erro ao acessar o banco de dados:", err);
      res.status(500).send("Erro interno do servidor");
  }
});

app.get('/Dashboard/Analytics', async (req, res) => {
  if (!req.session.user) return res.redirect("/login");
  
  res.render("dashboard/analytics.html", { user: req.session.user, pageName: "Dashboard" })
})

app.get('/Dashboard/Ticket/:id', async (req, res) => {
  const ticketId = req.params.id;

  try {
    const db = await connectDB();
    const collection = db.collection('tickets');
    const ticket = await collection.findOne({ _id: new ObjectId(ticketId) });

    if (!ticketId) return res.render("main/500.html", { pageName: "500", error: "Ticket not found"})

    if (!req.session.user) return res.redirect("/")

    const createdAtFormatted = moment(ticket.createdAt).format('DD MMMM, YYYY');
    const createdAtTime = moment(ticket.createdAt).format('h:mm A');
    const timeFromNow = moment(ticket.createdAt).fromNow();

    return res.render("dashboard/tickets-preview.html", { user: req.session.user, pageName: "Dashboard", ticket, createdAtFormatted, createdAtTime, timeFromNow });
} catch (err) {
    console.error('Error fetching project:', err);
    res.status(500).send('Error loading project details');
}

})

app.post('/add-comment', async (req, res) => {
  const { userId, ticketId, commentary } = req.body;

  if (!req.session.user) {
    return res.status(403).send('Unauthorized'); 
  }

  try {
    const db = await connectDB();
    const usersCollection = db.collection('users');
    const projectsCollection = db.collection('projects');
    const ticketsCollection = db.collection('tickets');

    const user = await usersCollection.findOne({ _id: new ObjectId(userId) });

    if (!user) return res.render("main/500.html", { pageName: "500", error: "User not found"})

    const ticket = await ticketsCollection.findOne({ _id: new ObjectId(ticketId) });

    if (!ticket) return res.render("main/500.html", { pageName: "500", error: "Ticket not found"})

    const userComment = {
      user: user,
      commentary,
      createdAt: new Date()
    };

    const updateResult = await ticketsCollection.updateOne(
      { _id: new ObjectId(ticketId) },
      { $push: { comments: userComment } }
    );

    var targetid
    if (user._id.toString() == ticket.user._id.toString()) {
      var projects = await projectsCollection.find({ _id: new ObjectId(ticket.projectId) }).toArray();
      
      targetid = projects[0].ownerId
    } else targetid = ticket.user._id
  
    if (updateResult.modifiedCount === 1) {
      await addNotification(
        db,
        targetid, 
        `<p class='mb-1'>${req.session.user.name} commented on your ticket: "${ticket.title}"</p>`, 
        'ticket_comment',
        user.profileIcon
      );
      
      res.redirect('/Dashboard/Ticket/' + ticketId);
    } else return res.render("main/500.html", { pageName: "500", error: "Ticket not found"})
  } catch (error) {
    console.error('Failed to add comment:', error);
    res.status(500).send('Internal server error');
  }
});

async function addNotification(db, userId, message, type, infoIcon = null) {
  const notificationsCollection = db.collection('users');
  const notification = {
    message,
    type,
    viewed: false,
    date: new Date(),
    infoIcon
  };

  await notificationsCollection.updateOne(
    { _id: new ObjectId(userId) },
    { $push: { notifications: notification } }
  );
}

app.post('/update-ticket-priority', async (req, res) => {
  const { ticketId, newPriority } = req.body;

  if (!req.session.user) return res.redirect("/")

  try {
      const db = await connectDB();
      const ticketsCollection = db.collection('tickets');
      await ticketsCollection.updateOne(
          { _id: ObjectId.createFromHexString(ticketId) },
          { $set: { priority: newPriority } }
      );

      res.json({ success: true, message: 'Priority updated successfully.' });
  } catch (error) {
      console.error('Failed to update priority:', error);
      res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

app.post('/close-ticket', async (req, res) => {
  const { ticketId } = req.body;

  if (!req.session.user) {
    return res.status(403).send('Unauthorized');
  }

  try {
    const db = await connectDB();
    const ticketsCollection = db.collection('tickets');
    const updateResult = await ticketsCollection.updateOne(
      { _id: new ObjectId(ticketId) },
      { $set: { status: 'closed' } }
    );

    if (updateResult.modifiedCount === 1) {
      res.redirect("/Dashboard/Tickets")
    } else return res.render("main/500.html", { pageName: "500", error: "Ticket not found"})
  } catch (error) {
    console.error('Failed to close ticket:', error);
    res.status(500).send({ success: false, message: 'Internal server error' });
  }
});

// ============= Projects ============= //

app.get('/project/:id', async (req, res) => {
    const projectId = req.params.id;

    try {
        const db = await connectDB();
        const collection = db.collection('projects');
        const project = await collection.findOne({ _id: new ObjectId(projectId) });

        if (!project) return res.render("main/500.html", { pageName: "500", error: "Project not found"})
        
        return res.render("main/project/projectsdetails.html", { user: req.session.user, pageName: "project", project: project });
    } catch (err) {
        console.error('Error fetching project:', err);
        res.status(500).send('Error loading project details');
    }
});

app.get('/Projects-Grid', async (req, res) => {
  const limit = parseInt(req.query.limit) || 24;
  const page = parseInt(req.query.page) || 1;
  const location1 = req.query.location1 || '';
  const minInvestment = req.query.mininvestement || '';

  try {
    const db = await connectDB();
    const collection = db.collection('projects');

    let query = {};
    if (location1) {
      query['project-country'] = location1;
    }

    let sort = {};
    const sortOption = req.query.sort || 'match';
    switch (sortOption) {
      case 'newest':
        sort = { _id: -1 };
        break;
      case 'price':
        sort = { 'project-totalbudget': 1 };
        break;
      case 'match':
      default:
        sort = { _id: -1 };
        break;
    }

    const totalProjects = await collection.countDocuments(query);
    let projects = await collection.find(query)
                                   .sort(sort)
                                   .skip((page - 1) * limit)
                                   .limit(limit)
                                   .toArray();

    // Filtrar os projetos que não cumprem o critério de investimento mínimo
    if (minInvestment) {
      projects = projects.filter(project => {
        if (minInvestment === 'Any') {
          return true; // Não há requisitos de investimento mínimo
        } else {
          const minInvestmentValue = parseInt(minInvestment);
          const projectMinInvestment = parseInt(project['project-mininvestment']);
          if (minInvestmentValue != 50) return projectMinInvestment <= minInvestmentValue;
          else  return projectMinInvestment >= minInvestmentValue;
        }
      });
    }

    return res.render("main/project/projectsgrid", {
      user: req.session.user, 
      projects: projects,
      totalProjects: totalProjects,
      limit: limit,
      page: page,
      pageName: "Projects",
      totalPages: Math.ceil(totalProjects / limit),
      currentSort: sortOption,
    });
  } catch (err) {
    console.error('Erro ao buscar projetos:', err);
    res.status(500).send('Erro ao carregar a página de projetos');
  }
});



app.get('/Projects-List', async (req, res) => {
  const limit = parseInt(req.query.limit) || 24;
  const page = parseInt(req.query.page) || 1;
  const sortOption = req.query.sort || 'match'; 

  try {
      const db = await connectDB();
      const collection = db.collection('projects');
      const totalProjects = await collection.countDocuments();
      
      let sort = {};
      if (sortOption === 'newest') {
          sort = { _id: -1 };
      } else if (sortOption === 'price') {
          sort = { 'project-totalbudget': 1 };
      }

      const projects = await collection.find({})
                                       .sort(sort)
                                       .skip((page - 1) * limit)
                                       .limit(limit)
                                       .toArray();

      return res.render("main/project/projectslist", {
        user: req.session.user, 
        projects: projects,
        totalProjects: totalProjects,
        limit: limit,
        page: page,
        pageName: "Projects",
        totalPages: Math.ceil(totalProjects / limit),
        currentSort: sortOption,
      });
  } catch (err) {
      console.error('Failed to fetch projects:', err);
      res.status(500).send('Error loading project list');
  }
});

app.post('/add-project-comment', async (req, res) => {
  const { userId, projectId, comment } = req.body;

  try {
    const db = await connectDB();
    const projectsCollection = db.collection('projects');
    const usercollection = db.collection('users')

    const user = await usercollection.findOne({ _id: new ObjectId(userId) });

    const updateResult = await projectsCollection.updateOne(
      { _id: new ObjectId(projectId) },
      { $push: { comments: { user, comment, createdAt: new Date() } } }
    );


    if (updateResult.modifiedCount === 1) {
      res.redirect('/project/' + projectId);
    } else return res.render("main/500.html", { pageName: "500", error: "Project not found"})
  } catch (error) {
    console.error('Failed to add comment:', error);
    res.status(500).send('Internal server error');
  }
});

app.get('/api/projects', async (req, res) => {
  const limit = parseInt(req.query.limit) || 24;
  const page = parseInt(req.query.page) || 1;

  try {
      const db = await connectDB();
      const collection = db.collection('projects');
      const projects = await collection.find({})
                                       .skip((page - 1) * limit)
                                       .limit(limit)
                                       .toArray();
      const totalProjects = await collection.countDocuments();
      res.json({ success: true, projects, totalProjects });
  } catch (err) {
      console.error('Erro ao buscar projetos:', err);
      res.status(500).json({ success: false, message: 'Erro ao buscar projetos', error: err.toString() });
  }
});

app.post('/toggle-wishlist', async (req, res) => {
  if (!req.session.user) {
    return res.redirect("/");
  }

  const projectId = req.body.projectId;
  const userId = req.session.user._id;

  try {
    const db = await connectDB();
    const projectsCollection = db.collection('projects');
    const project = await projectsCollection.findOne({ _id: new ObjectId(projectId) });

    if (project.wishlist && project.wishlist.includes(userId)) {
      await projectsCollection.updateOne(
        { _id: new ObjectId(projectId) },
        { $pull: { wishlist: userId } }
      );
    } else {
      await projectsCollection.updateOne(
        { _id: new ObjectId(projectId) },
        { $addToSet: { wishlist: userId } }
      );
    }

    res.redirect(req.get('referer')); 
  } catch (err) {
    console.error('Database error:', err);
    res.status(500).send('Internal Server Error');
  }
});


app.post('/uploadIMG', upload.array('file'), (req, res) => { res.json(req.files); });

app.post('/addProject', upload.array('file'), async (req, res) => {
  try {
      const projectData = req.body;
      projectData.ownerId = req.session.user._id;

      const db = await connectDB();
      const projectsCollection = db.collection('projects');
      const usersCollection = db.collection('users');

      const result = await projectsCollection.insertOne(projectData);

      const ownerProfileIcon = req.session.user.profileIcon;
      const ownerName = req.session.user.name;

      const owner = await usersCollection.findOne({ _id: new ObjectId(req.session.user._id) });
      if (owner && owner.followers) {
          const followers = await usersCollection.find({
              _id: { $in: owner.followers.map(id => new ObjectId(id)) }
          }).toArray();

          followers.forEach(async user => {
              await addNotification(
                  db,
                  user._id.toString(), 
                  `<p class='mb-1'>A new project has been added by <b>${ownerName}</b>. Check it out!</p>`, 
                  "new_project",
                  ownerProfileIcon
              );
          });
      }

      res.json({ success: true, message: 'Project added successfully!', projectData, projectId: result.insertedId });
  } catch (err) {
      console.error('Error while saving to MongoDB:', err);
      res.status(500).json({ success: false, message: 'Error adding project', error: err.toString() });
  }
});

app.get('/Add-Project', async (req, res) => {
  if (!req.session.user || req.session.user.role != "Entrepreneur") return res.redirect("/")

  return res.render("main/project/addproject.html", { user: req.session.user, pageName: "Add Project" });
})

// ============= Notifications ============= //

async function addNotification(db, userId, message, type, infoIcon = null) {
  try {
      const notification = {
          message,
          type,
          viewed: false,
          date: new Date()
      };

      if (infoIcon) notification.infoIcon = infoIcon;

      await db.collection('users').updateOne(
          { _id: new ObjectId(userId) },
          { $push: { notifications: notification } }
      );
      return { success: true };
  } catch (error) {
      console.error('Failed to add notification:', error);
      return { success: false, error: error.message };
  }
}

app.post('/mark-notifications-read', async (req, res) => {
  const { userId } = req.body;

  try {
      const db = await connectDB();
      const usersCollection = db.collection('users');

      await usersCollection.updateMany(
          { _id: new ObjectId(userId), 'notifications.viewed': false },
          { $set: { 'notifications.$.viewed': true } }
      );

      res.redirect(req.get('referer'));
  } catch (error) {
      console.error('Failed to mark notifications as read:', error);
      res.status(500).send('Internal server error');
  }
});

app.get('/api/notifications', async (req, res) => {
  if (!req.session.user) {
      return res.status(403).json({ message: 'Unauthorized' });
  }

  const now = new Date().getTime();
  const lastFetch = req.session.lastNotificationFetch || 0;
  const timeSinceLastFetch = now - lastFetch;

  if (timeSinceLastFetch < 60000 && req.session.cachedNotifications) {
      return res.json({ success: true, cached: true, notifications: req.session.cachedNotifications });
  }

  req.session.lastNotificationFetch = now;

  try {
      const db = await connectDB();
      const notifications = await db.collection('users').findOne(
          { _id: new ObjectId(req.session.user._id) },
          { projection: { notifications: 1 } }
      );

      notifications.notifications.forEach(notification => {
        if (notification.type == "new_project") notification.type = "🏢"
        else if (notification.type == "ticket_comment") notification.type = "💬"
        else if (notification.type == "new_follower") notification.type = "👤"
      });
      

      if (notifications && notifications.notifications) {
          notifications.notifications.forEach(notification => {
              notification.date = moment(notification.date).format('LLL');
          });

          req.session.cachedNotifications = notifications.notifications;
      }
      
      res.json({ success: true, cached: false, notifications: notifications.notifications || [] });
  } catch (error) {
      console.error('Database error:', error);
      res.status(500).json({ message: 'Internal server error' });
  }
});

// ============= Community ============= //

app.get('/Community', async (req, res) => {
  try {
    const db = await connectDB();
    const projectsCollection = db.collection('projects');
    const communityProjects = await projectsCollection.find({}).toArray();
    
    res.render('main/community/projectslist.html', { user: req.session.user, pageName: 'Community Projects', communityProjects: communityProjects });
  } catch (error) {
    console.error('Failed to fetch community projects:', error);
    res.status(500).send('Internal server error');
  }
});


app.get('/Community/:projectId', async (req, res) => {
  const projectId = req.params.projectId;

  try {
    const db = await connectDB();
    const projectsCollection = db.collection('projects');
    const project = await projectsCollection.findOne({ _id: new ObjectId(projectId) });

    if (!project) return res.status(404).send('Project not found');

    if (project.communityPosts && project.communityPosts.length > 0) {
      project.communityPosts.forEach(function(post) {
        post.createdAt = moment(post.createdAt).format('DD MMMM, YYYY');
      })
    }
    

    res.render('main/community/comminutypreview.html', { user: req.session.user, pageName: 'Community Project', project: project });
  } catch (error) {
    console.error('Failed to fetch community project:', error);
    res.status(500).send('Internal server error');
  }
});

app.post('/add-project-community-post/:projectId', async (req, res) => {
  const db = await connectDB();
  const projectsCollection = db.collection('projects');

  const projectId = req.params.projectId;
  const project = await projectsCollection.findOne({ _id: new ObjectId(projectId) });

  if (!project) return res.render("main/500.html", { pageName: "500", error: "Project not found"})

  const { title, content } = req.body;
  const newPost = { title, content, author: 'Anonymous', createdAt: new Date() };

  await projectsCollection.updateOne(
    { _id: new ObjectId(projectId) },
    { $push: { communityPosts: newPost } }
  );
  
  res.redirect(req.get('referer'));
});

// ============= General ============= //

app.get("/Support", async (req, res) => {
  const projectId = req.query.projectId;
  try {
      const db = await connectDB();
      const project = await db.collection('projects').findOne({ _id: new ObjectId(projectId) });
      const projects = await db.collection('projects').find({}).toArray();

      return res.render("main/support.html", { user: req.session.user, pageName: "Support", projectMarked: project, projects: projects, message: "" });
  } catch (err) {
      console.error('Failed to fetch project:', err);
      res.status(500).send('Error loading support page');
  }
});

app.post('/submit-support', async (req, res) => {
  const { project, title, description } = req.body;

  if (!req.session.user) return res.redirect("/Login")

  try {
      const db = await connectDB();
      const collection = db.collection('tickets');

      const ticket = {
          projectId: ObjectId.createFromHexString(project),
          title: title,
          description: description,
          status: 'open',
          createdAt: new Date(),
          user: req.session.user
      };

      const result = await collection.insertOne(ticket);

      if (result.acknowledged) {
          console.log('Ticket submitted successfully:', result.insertedId);
          return res.render('main/support.html', { user: req.session.user, pageName: "Support", message: 'Ticket submitted successfully.', messageType: 'success', projects: await db.collection('projects').find().toArray(), projectMarked: await db.collection('projects').findOne({ _id: ObjectId.createFromHexString(project) }) });
      } else {
          throw new Error('Ticket submission failed');
      }
  } catch (error) {
      console.error('Error submitting ticket:', error);
      return res.render('main/support.html', { user: req.session.user, pageName: "Support", message: 'Error submitting support ticket.', messageType: 'error', projects: await db.collection('projects').find().toArray() });
  }
});

app.get("/FAQ", (req, res) => {
  const faqs = [
    {
      question: "What is the Indie Game Hub about?",
      answer: "The Indie Game Hub is a platform dedicated to supporting and showcasing independent game developers from around the world. It provides a space for developers to publish their games, connect with fellow creators, and access resources to help them succeed in the competitive gaming industry."
    },
    {
      question: "What are the benefits of publishing my game on the Indie Game Hub?",
      answer: "Publishing your game on the Indie Game Hub opens up opportunities for exposure to a global audience of gamers. Additionally, you can connect with potential collaborators, receive feedback from the community, and access marketing and promotional support to help your game stand out."
    },
    {
      question: "How do I submit my game to the Indie Game Hub?",
      answer: "Submitting your game to the Indie Game Hub is easy. Simply create an account on our platform, fill out the submission form with details about your game, and upload any necessary files or assets. Our team will review your submission and get back to you with feedback or approval."
    },
    {
      question: "What kind of games are accepted on the Indie Game Hub?",
      answer: "We welcome a diverse range of games on the Indie Game Hub, including but not limited to indie, casual, mobile, and browser-based games. Whether you're a solo developer or part of a studio, we encourage you to submit your game for consideration."
    },
    {
      question: "Is there a fee for submitting my game to the Indie Game Hub?",
      answer: "No, there is no fee for submitting your game to the Indie Game Hub. Our platform is committed to supporting indie developers and providing opportunities for their games to reach a wider audience."
    },
    {
      question: "How can I track the performance of my game on the Indie Game Hub?",
      answer: "Once your game is published on the Indie Game Hub, you'll have access to analytics tools that allow you to track key performance metrics such as downloads, user engagement, and revenue generation. This data will help you make informed decisions to optimize your game's success."
    },
    {
      question: "Are there any revenue-sharing agreements for games published on the Indie Game Hub?",
      answer: "Yes, we offer revenue-sharing agreements for games published on the Indie Game Hub. Our platform operates on a revenue-sharing model, ensuring that developers receive a fair share of the earnings generated by their games."
    },
    {
      question: "What support does the Indie Game Hub provide to developers?",
      answer: "The Indie Game Hub provides comprehensive support to developers, including marketing assistance, community engagement opportunities, and access to educational resources and networking events. Our goal is to empower indie developers and help them thrive in the competitive gaming market."
    },
    {
      question: "How can I connect with other developers on the Indie Game Hub?",
      answer: "The Indie Game Hub features community forums, chat channels, and networking events where developers can connect, collaborate, and share knowledge and experiences. Joining our community is a great way to expand your network and learn from fellow developers."
    },
    {
      question: "Can I update my game after it's been published on the Indie Game Hub?",
      answer: "Yes, you can update your game on the Indie Game Hub at any time. Simply log in to your account, make the necessary changes or improvements to your game, and resubmit it for review. Our team will ensure that the updated version is promptly available to players."
    }
  ];

  return res.render("main/faq.html", { user: req.session.user, pageName: "FAQ", faqs: faqs });
});

app.get('/Developers', async (req, res) => {
  try {
      const db = await connectDB();
      const usersCollection = db.collection('users');
      const developers = await usersCollection.find({ role: "Entrepreneur" }).toArray();
      res.render('main/developers.html', { pageName: "Developers", user: req.session.user, developers });
  } catch (error) {
      console.error('Failed to fetch entrepreneurs:', error);
      res.status(500).send('Internal server error');
  }
});

app.get("*", async (req, res) => {
  const db = await connectDB();
  const projects = await db.collection('projects').find({}).sort({ createdAt: -1 }).limit(3).toArray();
  const devs = await db.collection('users').find({ role: "Entrepreneur" }).sort({ createdAt: -1 }).limit(6).toArray();

  if (req.path == "/") {
    if (req.session.user) {
      return res.render("main/index.html", { user: req.session.user, pageName: "Home", projects: projects, countries, devs });
    } else {
      return res.render("main/index.html", { user: null, pageName: "Home", projects: projects, countries, devs });
    }
  } else {
    return res.render("main/404.html", { user: req.session.user, pageName: "404"});
  }
});

app.listen(port, () => {
  console.log(`Servidor rodando em http://localhost:${port}`);
});
