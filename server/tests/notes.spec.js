const request = require("supertest");
const app = require("../server-app");

//register if needed, then login and return token
async function loginTestUser() {
  const email = "notes_test@example.com";
  const password = "password1234";

  //Try to register; ignore "email exists" error
  const reg = await request(app)
    .post("/api/auth/register")
    .send({ email, password });

  if (![200, 201, 400].includes(reg.status)) {
    throw new Error(
      `Register failed with status ${reg.status}: ${JSON.stringify(reg.body)}`
    );
  }

  const login = await request(app)
    .post("/api/auth/login")
    .send({ email, password });

  if (login.status !== 200 || !login.body.token) {
    throw new Error(
      `Login failed: ${login.status} ${JSON.stringify(login.body)}`
    );
  }

  return login.body.token;
}

describe("Notes CRUD (owned)", () => {
  test("create, update, delete", async () => {
    const token = await loginTestUser();

    //create
    const created = await request(app)
      .post("/api/notes")
      .set("Authorization", `Bearer ${token}`)
      .send({ content: "Hello" });
    expect(created.status).toBe(201);
    expect(created.body.note?.id).toBeTruthy();
    const noteId = created.body.note.id;

    //update
    const updated = await request(app)
      .put(`/api/notes/${noteId}`)
      .set("Authorization", `Bearer ${token}`)
      .send({ content: "Updated! " });
    expect(updated.status).toBe(200);
    expect(updated.body.note?.content).toBe("Updated!");

    //delete
    const deleted = await request(app)
      .delete(`/api/notes/${noteId}`)
      .set("Authorization", `Bearer ${token}`);
    expect(deleted.status).toBe(204);

    //get after delete -> not found
    const updateAfterDelete = await request(app)
      .put(`/api/notes/${noteId}`)
      .set("Authorization", `Bearer ${token}`)
      .send({ content: "Should fail" });
    expect(updateAfterDelete.status).toBe(404);
  });
});
