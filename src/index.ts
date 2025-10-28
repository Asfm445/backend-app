import express, { Request, Response } from "express";
import cors from "cors";

const app = express();
app.use(cors());
app.use(express.json());

interface User {
  id: number;
  name: string;
}

let users: User[] = [];

// CREATE
app.post("/users", (req: Request, res: Response) => {
  const { name } = req.body;
  if (!name) return res.status(400).json({ error: "Name required" });

  const newUser = { id: Date.now(), name };
  users.push(newUser);
  res.status(201).json(newUser);
});

// READ
app.get("/users", (req: Request, res: Response) => {
  res.status(200).json(users);
});

// UPDATE
app.patch("/users/:id", (req: Request, res: Response) => {
  const id = parseInt(req.params.id, 10);
  if (Number.isNaN(id)) return res.status(400).json({ error: "Invalid id" });

  const { name } = req.body;
  if (name !== undefined && typeof name !== "string")
    return res.status(400).json({ error: "Invalid name" });

  const user = users.find(u => u.id === id);
  if (!user) return res.status(404).json({ error: "User not found" });

  if (name !== undefined) user.name = name;
  res.status(200).json(user);
});

// DELETE
app.delete("/users/:id", (req: Request, res: Response) => {
  const id = parseInt(req.params.id, 10);
  if (Number.isNaN(id)) return res.status(400).json({ error: "Invalid id" });

  const existingLength = users.length;
  users = users.filter(u => u.id !== id);
  if (users.length === existingLength) return res.status(404).json({ error: "User not found" });

  res.status(204).send();
});

app.listen(5000, () => console.log("🚀 Server running on port 5000"));
