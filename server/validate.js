const { z } = require("zod");

//helper
function validate(schema) {
  return (req, res, next) => {
    try {
      schema.parse({ body: req.body, params: req.params, query: req.query });
      next();
    } catch (e) {
      const issues =
        e.issues?.map((i) => ({
          path: i.path.join("."),
          message: i.message,
        })) || [];
      return res
        .status(400)
        .json({ error: "ValidationError", details: issues });
    }
  };
}

const registerSchema = z.object({
  body: z.object({
    email: z.string().email(),
    password: z.string().min(8).max(72), //bcrypt safe max
  }),
});

const loginSchema = z.object({
  body: z.object({
    email: z.string().email(),
    password: z.string().min(1),
  }),
});

const createNoteSchema = z.object({
  body: z.object({
    content: z.string().trim().min(1).max(2000),
  }),
});

const noteIdParam = z.object({
  params: z.object({
    id: z.coerce.number().int().positive(), // coerce "123" -> 123 and validate
  }),
});

const updateNoteSchema = z.object({
  params: z.object({
    id: z.coerce.number().int().positive(),
  }),
  body: z.object({
    content: z.string().trim().min(1).max(2000),
  }),
});

module.exports = {
  validate,
  registerSchema,
  loginSchema,
  createNoteSchema,
  updateNoteSchema,
  noteIdParam,
};
