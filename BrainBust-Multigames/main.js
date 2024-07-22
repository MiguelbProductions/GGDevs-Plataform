const express = require("express")
const bodyParser = require("body-parser")
const path = require("path")
const session = require('express-session')
const bcrypt = require('bcrypt')
const fileUpload = require('express-fileupload')
const { MongoClient, ObjectId, Int32 } = require("mongodb")
const compiler = require('compilex')
const MongoStore = require('connect-mongo');

const app = express()

require('dotenv').config();

const dbUrl = process.env.MONGO_URI
const dbName = "BrainBurst"

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

app.engine("html", require("ejs").renderFile)
app.set("view engine", "html")
app.use("/public", express.static(path.join(__dirname, "public")))
app.set("views", path.join(__dirname, "/views"))

app.use(bodyParser.json())
app.use(bodyParser.urlencoded({ extended: true }))
app.use(session(sessionConfig))
app.use(fileUpload())

var options = {stats : true}
compiler.init(options)

app.get("/:page?", async (req, res) => {
  const page = req.params.page || "Home"
  let user

  if (req.session.userId) {
    try {
      const client = await MongoClient.connect(dbUrl)
      const db = client.db(dbName)
      const users = db.collection("Users")

      const userId = new ObjectId(req.session.userId)

      user = await users.findOne({ _id: userId })
      if (user) user.password = undefined

    } catch (err) {
      console.log(err)
    }
  }

  res.render(`main/${page}.html`, { currentPage: page, pagesession: null, user: user }, (err, html) => {
      if (err)res.render("main/404.html", { currentPage: page, pagesession: null, user: user })
      else res.send(html)
  })
})

app.get("/minigames/menu", async (req, res) => {
  let user

  if (req.session.userId) {
    try {
      const client = await MongoClient.connect(dbUrl)
      const db = client.db(dbName)
      const users = db.collection("Users")

      const userId = new ObjectId(req.session.userId)

      user = await users.findOne({ _id: userId })
      if (user) user.password = undefined

    } catch (err) {
      console.log(err)
    }
  } else {
    req.session.redirectTo = req.originalUrl
    res.redirect('/auth/login')
    return
  }

  res.render(`minigames/Menu.html`, { currentPage: "menu", pagesession: null, user: user }, (err, html) => {
      if (err)res.render("main/404.html", { currentPage: "menu", pagesession: null, user: user })
      else res.send(html)
  })
})

app.get("/minigames/menu/:menupage?", async (req, res) => {
  const menupage = req.params.menupage
  let user
  
  if (req.session.userId) {
    try {
      const client = await MongoClient.connect(dbUrl)
      const db = client.db(dbName)
      const users = db.collection("Users")

      const userId = new ObjectId(req.session.userId)

      user = await users.findOne({ _id: userId })
      if (user) user.password = undefined

    } catch (err) {
      console.log(err)
    }
  } else {
    req.session.redirectTo = req.originalUrl
    res.redirect('/auth/login')
    return
  }

  pagesession = menupage

  if (menupage == "party") pagesession = "Party Games"

  res.render(`minigames/${menupage}/menu-${menupage}.html`, { currentPage: "menu", pagesession: pagesession, user: user }, (err, html) => {
      if (err)res.render("main/404.html", { currentPage: "menu", pagesession: pagesession, user: user })
      else res.send(html)
  })
})

app.get("/minigames/party/sequentialboxes", async (req, res) => {
  let user

  if (req.session.userId) {
    try {
      const client = await MongoClient.connect(dbUrl)
      const db = client.db(dbName)
      const users = db.collection("Users")

      const userId = new ObjectId(req.session.userId)

      user = await users.findOne({ _id: userId })
      if (user) user.password = undefined

    } catch (err) {
      console.log(err)
    }
  } else {
    req.session.redirectTo = req.originalUrl
    res.redirect('/auth/login')
    return
  }

  res.render(`minigames/party/sequentialboxes.html`, { currentPage: "Sequential Boxes", pagesession: "Party Games", user: user }, (err, html) => {
      if (err)res.render("main/404.html", { currentPage: "Sequential Boxes", pagesession: "Party Games", user: user })
      else res.send(html)
  })
})

app.get("/minigames/programming/codemaster/problems", async (req, res) => {
  let user
  let solvedProblems = []

  if (req.session.userId) {
    try {
      const client = await MongoClient.connect(dbUrl)
      const db = client.db(dbName)
      const users = db.collection("Users")
      const codeMasterUsers = db.collection("CodeMaster_Users")

      const userId = new ObjectId(req.session.userId)

      user = await users.findOne({ _id: userId })
      if (user) user.password = undefined

      const userRecord = await codeMasterUsers.findOne({ userId: userId })
      if (userRecord) {
        solvedProblems = userRecord.solvedProblems || []
      }
      
    } catch (err) {
      console.log(err)
    }
  } else {
    req.session.redirectTo = req.originalUrl
    res.redirect('/auth/login')
    return
  }

  let problems
  try {
    const client = await MongoClient.connect(dbUrl)
    const db = client.db(dbName)
    const problemsCollection = db.collection("CodeMaster_Problems")

    problems = await problemsCollection.find({}).toArray()
  } catch (err) {
    console.log(err)
    problems = []
  }

  res.render(`minigames/programming/games/codemaster.html`, {
    currentPage: "Code Master",
    pagesession: "Programming",
    user: user,
    problems: problems,
    solvedProblems: solvedProblems
  }, (err, html) => {
    if (err) res.render("main/404.html", { currentPage: "Code Master", pagesession: "Programming" , user: user })
    else res.send(html)
  })
})

app.get("/minigames/programming/codecherif", async (req, res) => {
  if (req.session.userId) {
    try {
      const client = await MongoClient.connect(dbUrl)
      const db = client.db(dbName)
      const users = db.collection("Users")
      const codeMasterUsers = db.collection("CodeMaster_Users")

      const userId = new ObjectId(req.session.userId)

      user = await users.findOne({ _id: userId })
      if (user) user.password = undefined

      const userRecord = await codeMasterUsers.findOne({ userId: userId })
      if (userRecord) {
        solvedProblems = userRecord.solvedProblems || []
      }
      
    } catch (err) {
      console.log(err)
    }
  } else {
    req.session.redirectTo = req.originalUrl
    res.redirect('/auth/login')
    return
  }
  
  res.render(`minigames/programming/games/codesherrif.html`, {
    currentPage: "Code Master",
    pagesession: "Programming",
    user: user,
  })
})


app.get("/minigames/programming/codemaster/problem/:problem_id?", async (req, res) => {
  const problem_id = req.params.problem_id

  if (!problem_id) {
    res.redirect("/programming/codemaster/problems")
    return
  }

  let user, problemDetails
  if (req.session.userId) {
    try {
      const client = await MongoClient.connect(dbUrl)
      const db = client.db(dbName)
      const users = db.collection("Users")

      const userId = new ObjectId(req.session.userId)
      user = await users.findOne({ _id: userId })
      if (user) user.password = undefined
    } catch (err) {
      console.log(err)
    }
  } else {
    req.session.redirectTo = req.originalUrl
    res.redirect('/auth/login')
    return
  }

  try {
    const client = await MongoClient.connect(dbUrl)
    const db = client.db(dbName)
    const codeMaster_problems = db.collection("CodeMaster_Problems")
 
    problemDetails = await codeMaster_problems.findOne({ ProblemNum: new Int32(problem_id)})
    problemCount = await codeMaster_problems.countDocuments({ ProblemNum: new Int32(problem_id) })

  } catch (err) {
    console.log(err)
  }

  res.render("minigames/programming/myide.html", { currentPage: "Code Master", pagesession: "Programming", user: user, problem: problemDetails }, (err, html) => {
     if (err) res.render("main/404.html", { currentPage: "Code Master", pagesession: "Programming" , user: user })
    else res.send(html)
  })
})

app.get('/auth/logout', (req, res) => {
  req.session.destroy(err => { res.redirect('/') })
})

app.get("/auth/:page?", (req, res) => {
  const page = req.params.page
  const successMessage = req.query.success || ''

  res.render(`auth/${page}.html`, { debug: { success: successMessage }, fields: {} }, (err, html) => {
      if (err) res.render("main/404.html", { currentPage: page, pagesession: null, user: null })
      else res.send(html)
  })
})

app.get("/admin/:page?", (req, res) => {
  const page = req.params.page
  
  res.render(`admin/${page}.html`, { currentPage: page, pagesession: null, user: null }, (err, html) => {
      if (err) res.render("main/404.html", { currentPage: page, pagesession: null, user: null })
      else res.send(html)
  })
})

app.post('/auth/login', async (req, res) => {
  const { username_or_email, passwordvalue } = req.body
  let errors = {}

  try {
    const client = await MongoClient.connect(dbUrl)
    const db = client.db(dbName)
    const users = db.collection("Users")

    const user = await users.findOne({ $or: [{ Username: username_or_email }, { Email: username_or_email }] })

    if (!user) errors.username_or_email = "User not found"
    else {
      const match = await bcrypt.compare(passwordvalue, user.Password)
      if (!match) errors.passwordvalue = "Incorrect Password"
    }

    if (Object.keys(errors).length > 0) {
      res.render('auth/login', { 
        debug: { errors: errors},
        fields: {
          username_or_email: req.body.username_or_email
        }
      })
    } else {
      req.session.userId = user._id

      if (req.session.redirectTo) {
        const redirectUrl = req.session.redirectTo || '/'
        delete req.session.redirectTo
        res.redirect(redirectUrl)
      } else res.redirect('/')
    }
  } catch (err) {
    res.render('auth/login', { debug: { error: 'Error accessing users'} })
  }
}).post('/auth/register', async (req, res) => {
  const { email, name, username, password_field, confirm_password } = req.body
  let errors = {}

  if (!email.match(/^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/)) {
    errors.email = 'Please enter a valid email address.'
  }

  if (username.length < 3) {
    errors.username = 'Username must be at least 3 characters long.'
  }

  if (name.length < 3) {
    errors.name = 'Name must be at least 3 characters long.'
  }

  if (password_field != confirm_password) {
    errors.password = 'Passwords do not match.'
  } else {
    if (password_field.length < 8) {
      errors.password = "Password must be at least 8 characters long."
    } else if (!/[a-z]/.test(password_field)) {
      errors.password = "Password must contain at least one lowercase letter."
    } else if (!/[A-Z]/.test(password_field)) {
      errors.password = "Password must contain at least one uppercase letter."
    } else if (!/\d/.test(password_field)) {
      errors.password = "Password must contain at least one digit."
    } else if (!/[!@#$%^&*(),.?":{}|<>]/.test(password_field)) {
      errors.password = "Password must contain at least one special character."
    }
  }  

  if (Object.keys(errors).length > 0) {
    console.log(errors, password_field, !password_field.match(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/))
    res.render('auth/register', { 
      debug: { errors: errors },
      fields: {
        email: req.body.email,
        name: req.body.name,
        username: req.body.username,
      }
    })
    return
  }

  try {
    const client = await MongoClient.connect(dbUrl)
    const db = client.db(dbName)
    const users = db.collection("Users")

    const existingUser = await users.findOne({ $or: [{ Email: email }, { Username: username }] })

    if (existingUser) {
      errors.email = 'Email or username already exists. Please choose another.'
      errors.username = 'Email or username already exists. Please choose another.'
      
      res.render('auth/register', { 
        debug: { errors: errors },
        fields: {
          email: req.body.email,
          name: req.body.name,
          username: req.body.username,
        }
      })
      return
    } else {
      const hashedPassword = await bcrypt.hash(password_field, 10)

      await users.insertOne({
        Email: email,
        Name: name,
        Username: username,
        Password: hashedPassword,
        Image: '/public/img/icons/DefaultProfileIcon.png'
      })
  
      res.redirect('/auth/login?success=User+registered+successfully')
    }
  } catch (err) {
    res.render('auth/register', { debug: { error: 'Error accessing the database'} })
  }
})

app.post("/minigames/programming/codemaster/problem/:problem_id?", async (req, res) => {
  try {
      const { language, code } = req.body
      const problem_id = req.params.problem_id

      const client = await MongoClient.connect(dbUrl)
      const db = client.db(dbName)
      const codeMaster_problems = db.collection("CodeMaster_Problems")
      const codeMaster_users = db.collection("CodeMaster_Users")
      const problemDetails = await codeMaster_problems.findOne({ ProblemNum: parseInt(problem_id) })

      let variableCode = ""
      if (problemDetails.Variables) {
          const vars = problemDetails.Variables
          Object.keys(vars).forEach(key => {
              const value = vars[key]
              switch (language) {
                  case "python":
                      variableCode += `${key} = ${value}\n`
                      break
                  case "java":
                      variableCode += `int ${key} = ${value}\n`
                      break
                  case "csharp":
                      variableCode += `int ${key} = ${value}\n`
                      break
                  case "c":
                      variableCode += `int ${key} = ${value}\n`
                      break
              }
          })
      }
      
      const finalCode = variableCode + code

      const expectedOutput = problemDetails.Result
      var envData = { OS: "windows" }
      if (language === "c") {
          envData.cmd = "g++"
      }

      const startTime = Date.now();

      const interpretOutput = (data) => {
        if (data.output) {
            let finalOutput = data.output
            const outputNumber = parseFloat(data.output)

            const endTime = Date.now();
            const executionTime = endTime - startTime;
    
            if (!isNaN(outputNumber)) {
                if (Math.floor(outputNumber) !== outputNumber) {
                    if (outputNumber % 1 === 0) {
                        finalOutput = Math.round(outputNumber).toString()
                    } else {
                        finalOutput = outputNumber.toString()
                    }
                } else {
                    finalOutput = outputNumber.toString()
                }
            }
    
            const normalizedOutput = finalOutput.replace(/\r\n|\r/g, "\n").trim()
            const normalizedExpectedOutput = expectedOutput.toString().replace(/\r\n|\r/g, "\n").trim()
            const status = (normalizedOutput == normalizedExpectedOutput) ? "Accepted" : "Declined"

            return { output: finalOutput, status: status, executionTime: `${executionTime} ms` }
        } else {
            return { error: data.error}
        }
      }   

      const statusUser = async (command) => {
        if (command.status === "Accepted") {
          let userRecord = await codeMaster_users.findOne({ userId: new ObjectId(req.session.userId) })
  
          if (!userRecord) {
              await codeMaster_users.insertOne({
                  userId: new ObjectId(req.session.userId),
                  solvedProblems: [parseInt(problem_id)]
              })
          } else {
              if (userRecord.solvedProblems.indexOf(parseInt(problem_id)) === -1) {
                  await codeMaster_users.updateOne(
                      { userId: new ObjectId(req.session.userId) },
                      { $push: { solvedProblems: parseInt(problem_id) } }
                  )
              }
          }
        }
      }

      if (language === "python") {
          compiler.compilePython(envData, finalCode, function(data) { 
            var command = interpretOutput(data)

            statusUser(command)
            res.send(command) 
          })
      } else if (language === "java") {
          compiler.compileJava(envData, finalCode, function(data) { 
            var command = interpretOutput(data)

            statusUser(command)
            res.send(command) 
          })
      } else if (language === "csharp") {
          compiler.compileCS(envData, finalCode, function(data) { 
            var command = interpretOutput(data)

            statusUser(command)
            res.send(command) 
          })
      } else if (language === "c") {
          compiler.compileCPP(envData, finalCode, function(data) { 
            var command = interpretOutput(data)

            statusUser(command)
            res.send(command) 
          })
      } else if (language === "visualbasic") {
          compiler.compileVB(envData, finalCode, function(data) { 
            var command = interpretOutput(data)

            statusUser(command)
            res.send(command) 
          })
      } else {
          res.status(400).send('Unsupported programming language')
      }
  } catch (error) {
      console.error(error)
      res.status(500).send('Error processing your request')
  }
})

app.post('/minigames/party/sequentialboxes', async (req, res) => {
  const { score } = req.body;
  if (score == 0) return

  var userId = req.session.userId

  try {
      const client = await MongoClient.connect(dbUrl);
      const db = client.db(dbName);
      const partyGamesCollection = db.collection("PartyGames");

      let userDocument = await partyGamesCollection.findOne({ userId: new ObjectId(userId) });

      if (!userDocument) {
          await partyGamesCollection.insertOne({
              userId: new ObjectId(userId),
              SequentialBoxes: {
                  TopScore: score,
                  AverageScore: score,
                  Scores: [score]
              }
          });
      } else {
          const currentTopScore = userDocument.SequentialBoxes.TopScore;
          const newTopScore = Math.max(currentTopScore, score);

          const newScores = [...userDocument.SequentialBoxes.Scores, score];
          const newAverageScore = newScores.reduce((acc, curr) => acc + curr, 0) / newScores.length;

          await partyGamesCollection.updateOne(
              { userId: new ObjectId(userId) },
              {
                  $set: {
                      "SequentialBoxes.TopScore": newTopScore,
                      "SequentialBoxes.AverageScore": newAverageScore,
                      "SequentialBoxes.Scores": newScores
                  }
              }
          );
      }

      res.json({ message: 'Score updated successfully' });
  } catch (error) {
      console.error(error);
      res.status(500).send('Error updating score');
  }
});


const PORT = 7001
app.listen(PORT, () => {
    console.log(`BrainBurst running on Port ${PORT}`)
})