const express = require("express");
const app = express();
const morgan = require("morgan");
const cors = require("cors");
require("dotenv").config();
const Person = require("./models/person");
morgan.token("reqBody", (req) => JSON.stringify(req.body));

app.use(
  morgan(
    ":method :url :status :res[content-length] - :response-time ms :reqBody"
  )
);
app.use(express.json());
app.use(express.static("build"));
app.use(cors());

app.get("/api/persons", (req, res) => {
  Person.find({}).then((people) => res.json(people));
});

app.get("/api/persons/:id", (req, res, next) => {
  Person.findById(req.params.id)
    .then((person) => {
      if (person) {
        res.json(person);
      } else {
        res.status(404).end();
      }
    })
    .catch((error) => {
      console.log("get id error");
      next(error);
    });
});

app.get("/info", (req, res) => {
  Person.countDocuments().then((count) =>
    res.send(
      `<p>Phonebook has info for ${count} people</p><p>${new Date()}</p>`
    )
  );
});

app.delete("/api/persons/:id", (req, res,next) => {
  Person.findByIdAndRemove(req.params.id)
    .then(() => res.status(204).end())
    .catch((error) => next(error));
});

app.post("/api/persons", (req, res, next) => {
  const body = req.body;
  if (!body.name || !body.number) {
    return res.status(400).json({
      error: "The name or number must not be missing",
    });
  }

  // if (persons.some((person) => person.name === body.name)) {
  //   return res.status(400).json({
  //     error: "Name must be unique",
  //   });
  // }
  const newPerson = new Person({
    name: body.name,
    number: body.number,
  });
  newPerson
    .save()
    .then((savedNote) => {
      res.json(savedNote);
    })
    .catch((error) => {
      console.log(error.message);
      next(error);
    });
});

app.put("/api/persons/:id", (req, res, next) => {
  const body = req.body;
  const newPerson = {
    name: body.name,
    number: body.number,
  };
  const opts = { runValidators: true, context: "query", new: true };

  Person.findByIdAndUpdate(req.params.id, newPerson, opts)
    .then((updatedPerson) => {
      if (!updatedPerson) {
        // const err = new Error("Update not found");
        // err.status = 400;
        // return next(err);
        return res.status(400).json({ error: "Update id not found" });
      }
      res.json(updatedPerson);
    })
    .catch((error) => next(error));
});

const unknownEndpoit = (req, res) => {
  res.status(404).send({ error: "unknown endpoint" });
};

app.use(unknownEndpoit);

const errorHandler = (error, req, res, next) => {
  console.log(error.name, error.message);
  if (error.name === "CastError") {
    return res.status(400).json({ name: error.name, error: error.message });
  } else if (error.name === "ValidationError") {
    return res.status(400).json({ name: error.name, error: error.message });
  }
  next(error);
};

app.use(errorHandler);

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
