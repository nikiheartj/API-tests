import { test, expect } from '@playwright/test';
import { faker } from '@faker-js/faker';

let token; // Session token

test.describe('API Challenges', () => {
  test.beforeAll(
    'Get X-Challenger token - POST token (201)',
    async ({ request }) => {
      const response = await request.post('/challenger');
      const headers = await response.headers();
      token = headers['x-challenger'];
      console.log(token);

      expect(response.status()).toBe(201);
    }
  );

  test('@GET the list of challenges', async ({ request }) => {
    const response = await request.get('/challenges', {
      headers: {
        'x-challenger': token
      }
    });
    expect(response.status()).toBe(200);
    const body = await response.json();

    expect(body.challenges.length).toEqual(59);
  });

  test('@GET the list of todos', async ({ request }) => {
    const response = await request.get('/todos', {
      headers: {
        'x-challenger': token
      }
    });
    const todos = await response.json();

    expect(response.status()).toBe(200);
    expect(todos.todos.length).toEqual(10);
  });

  test(`Can't @GET a todo when endpoint (not plural) is wrong`, async ({
    request
  }) => {
    const response = await request.get('/todo', {
      headers: {
        'x-challenger': token
      }
    });

    expect(response.status()).toBe(404);
  });

  test('@GET correct todo{id} in the list', async ({ request }) => {
    const response = await request.get('/todos/3', {
      headers: {
        'x-challenger': token
      }
    });
    const body = await response.json();

    expect(response.status()).toBe(200);
    expect(body.todos).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          id: 3,
          title: 'process payments',
          doneStatus: false,
          description: ''
        })
      ])
    );
  });

  test(`Can't @GET wrong todo{id} in the list`, async ({ request }) => {
    const response = await request.get('/todos/33', {
      headers: {
        'x-challenger': token
      }
    });

    expect(response.status()).toBe(404);
  });

  test('Get the list of headers. @HEAD', async ({ request }) => {
    const response = await request.head('/todos', {
      headers: {
        'x-challenger': token
      }
    });
    const headers = await response.headers();

    expect(headers).toHaveProperty('date');
    expect(headers).toHaveProperty('x-robots-tag');
    expect(headers).toHaveProperty('content-type');
    expect(response.status()).toBe(200);
  });

  test('Create a todo. @POST', async ({ request }) => {
    const response = await request.post('/todos', {
      headers: {
        'x-challenger': token
      },
      data: {
        title: 'QA check',
        doneStatus: true,
        description: 'QA check'
      }
    });
    const DATA = JSON.parse(await response.text());

    expect(response.status()).toBe(201);
    expect(DATA.title).toEqual('QA check');
    expect(DATA.doneStatus).toEqual(true);
    expect(DATA.description).toEqual('QA check');
  });

  test(`Can't create a todo with wrong 'doneStatus': boolean value. @POST`, async ({
    request
  }) => {
    const response = await request.post('/todos', {
      headers: {
        'x-challenger': token
      },
      data: {
        title: 'QA check1',
        doneStatus: 3,
        description: 'QA check1'
      }
    });
    const body = await response.json();

    expect(response.status()).toBe(400);
    expect(body).toHaveProperty('errorMessages', [
      'Failed Validation: doneStatus should be BOOLEAN but was NUMERIC'
    ]);
  });

  test(`Can't create a todo with too long title. @POST`, async ({
    request
  }) => {
    const response = await request.post('/todos', {
      headers: {
        'x-challenger': token
      },
      data: {
        title: faker.lorem.words(10).substring(0, 51),
        doneStatus: true,
        description: 'QA check2'
      }
    });
    const body = await response.json();

    expect(response.status()).toBe(400);
    expect(body.errorMessages).toEqual(
      expect.arrayContaining([
        'Failed Validation: Maximum allowable length exceeded for title - maximum allowed is 50'
      ])
    );
  });

  test(`Can't create a todo with too long description. @POST`, async ({
    request
  }) => {
    const response = await request.post('/todos', {
      headers: {
        'x-challenger': token
      },
      data: {
        title: 'Title',
        doneStatus: true,
        description: faker.lorem.words(50).substring(0, 201)
      }
    });
    const body = await response.json();

    expect(response.status()).toBe(400);
    expect(body.errorMessages).toEqual([
      'Failed Validation: Maximum allowable length exceeded for description - maximum allowed is 200'
    ]);
  });

  test('Create a todo with max out content. @POST', async ({ request }) => {
    const response = await request.post('/todos', {
      headers: {
        'x-challenger': token
      },
      data: {
        title: faker.lorem.words(10).substring(0, 50),
        doneStatus: true,
        description: faker.lorem.words(50).substring(0, 200)
      }
    });
    const body = await response.json();

    expect(body.title.length).toBeLessThanOrEqual(50);
    expect(body.description.length).toBeLessThanOrEqual(200);
    expect(response.status()).toBe(201);
  });

  test(`Can't create a todo with exceeded 5000 characters characters in payload. @POST`, async ({
    request
  }) => {
    const response = await request.post('/todos', {
      headers: {
        'x-challenger': token
      },
      data: {
        title: 'Full title length Full title length Full title len',
        doneStatus: true,
        description: faker.lorem.words(1000).substring(0, 5001)
      }
    });
    const body = await response.json();

    expect(body.errorMessages).toEqual(
      expect.arrayContaining([
        'Error: Request body too large, max allowed is 5000 bytes'
      ])
    );
    expect(response.status()).toBe(413);
  });

  test(`Can't create a todo because the payload contains an unrecognised field. @POST`, async ({
    request
  }) => {
    const response = await request.post('/todos', {
      headers: {
        'x-challenger': token
      },
      data: {
        title: 'Full title length Full title length Full title len',
        doneStatus: true,
        description: '',
        tags: {
          badge: 1,
          New: 'satisfies'
        }
      }
    });
    const body = await response.json();

    expect(body.errorMessages).toEqual(
      expect.arrayContaining(['Could not find field: tags'])
    );
    expect(response.status()).toBe(400);
  });

  test('Full update a todo via @PUT method', async ({ request }) => {
    const response = await request.put('/todos/1', {
      headers: {
        'x-challenger': token
      },
      data: {
        title: 'Put Method',
        doneStatus: true,
        description: 'Put Method'
      }
    });
    const body = await response.json();

    expect(body).toEqual(
      expect.objectContaining({
        title: 'Put Method',
        doneStatus: true,
        description: 'Put Method'
      })
    );
    expect(response.status()).toBe(200);
  });

  test('Partial update a todo via @PUT method', async ({ request }) => {
    const response = await request.put('/todos/1', {
      headers: {
        'x-challenger': token
      },
      data: {
        title: 'Put Method Partly2'
      }
    });
    const body = await response.json();

    expect(body).toEqual(
      expect.objectContaining({
        title: 'Put Method Partly2'
      })
    );
    expect(response.status()).toBe(200);
  });

  test(`Can't update a todo without mandatory title field. @PUT`, async ({
    request
  }) => {
    const response = await request.put('/todos/1', {
      headers: {
        'x-challenger': token
      },
      data: {
        doneStatus: true
      }
    });
    const body = await response.json();

    expect(response.status()).toBe(400);
    expect(body.errorMessages).toEqual(
      expect.arrayContaining(['title : field is mandatory'])
    );
  });

  test(`Can't update an existing todo because id different in payload. @PUT`, async ({
    request
  }) => {
    const response = await request.put('/todos/1', {
      headers: {
        'x-challenger': token
      },
      data: {
        id: 2,
        title: 'Put Method',
        doneStatus: true
      }
    });
    const body = await response.json();

    expect(response.status()).toBe(400);
    expect(body.errorMessages).toEqual(
      expect.arrayContaining(['Can not amend id from 1 to 2'])
    );
  });

  test(`Cannot create todo with PUT due to Auto fields id. @PUT`, async ({
    request
  }) => {
    const response = await request.put('/todos/33', {
      headers: {
        'x-challenger': token
      },
      data: {
        title: 'Put Method for creating entity',
        doneStatus: true
      }
    });
    const body = await response.json();

    expect(response.status()).toBe(400);
    expect(body.errorMessages).toEqual(
      expect.arrayContaining([
        'Cannot create todo with PUT due to Auto fields id'
      ])
    );
  });

  test(`Partial update via @POST method a certain todo{id}`, async ({
    request
  }) => {
    const response = await request.post('/todos/9', {
      headers: {
        'x-challenger': token
      },
      data: {
        title: 'POST1'
      }
    });
    const body = await response.json();

    expect(response.status()).toBe(200);
    expect(body).toEqual(
      expect.objectContaining({
        title: 'POST1'
      })
    );
  });

  test(`Can't update a todo which does not exist via @POST method`, async ({
    request
  }) => {
    const response = await request.post('/todos/47', {
      headers: {
        'x-challenger': token
      },
      data: {
        title: 'POST1'
      }
    });
    const body = await response.json();

    expect(response.status()).toBe(404);
    expect(body).toHaveProperty('errorMessages', [
      'No such todo entity instance with id == 47 found'
    ]);
  });

  test('@GET todos list with a query filter to get only todos which are `done`', async ({
    request
  }) => {
    const response = await request.get('/todos?doneStatus=true', {
      headers: {
        'x-challenger': token
      }
    });
    const body = await response.json();

    expect(response.status()).toBe(200);
    expect(body.todos.every((todo) => todo.doneStatus === true)).toBe(true);
  });

  test('@DELETE a todo in the todos list', async ({ request }) => {
    const response = await request.delete('/todos/1', {
      headers: {
        'x-challenger': token
      }
    });
    expect(response.status()).toBe(200);
  });

  test('@GET todos list with results in XML format', async ({ request }) => {
    const response = await request.get('/todos', {
      headers: {
        'x-challenger': token,
        accept: 'application/xml'
      }
    });
    const headers = await response.headers();

    expect(response.status()).toBe(200);
    expect(headers).toHaveProperty('content-type', 'application/xml');
  });

  test('@GET todos list with results in JSON format', async ({ request }) => {
    const response = await request.get('/todos', {
      headers: {
        'x-challenger': token,
        accept: 'application/json'
      }
    });
    const headers = await response.headers();

    expect(response.status()).toBe(200);
    expect(headers).toHaveProperty('content-type', 'application/json');
  });

  test('@GET todos list with results in default JSON format', async ({
    request
  }) => {
    const response = await request.get('/todos', {
      headers: {
        'x-challenger': token,
        accept: '*/*'
      }
    });
    const headers = await response.headers();

    expect(response.status()).toBe(200);
    expect(headers).toHaveProperty('content-type', 'application/json');
  });

  test('@GET todos list with results in the preferred XML format', async ({
    request
  }) => {
    const response = await request.get('/todos', {
      headers: {
        'x-challenger': token,
        accept: 'application/xml, application/json'
      }
    });
    const headers = await response.headers();

    expect(response.status()).toBe(200);
    expect(headers).toHaveProperty('content-type', 'application/xml');
  });

  test('@GET todos list when an empty accept header', async ({ request }) => {
    const response = await request.get('/todos', {
      headers: {
        'x-challenger': token,
        accept: ''
      }
    });
    const headers = await response.headers();

    expect(response.status()).toBe(200);
    expect(headers).toHaveProperty('content-type', 'application/json');
  });

  test(`Can't @GET todos list when unrecognised accept type header`, async ({
    request
  }) => {
    const response = await request.get('/todos', {
      headers: {
        'x-challenger': token,
        accept: 'application/gzip'
      }
    });
    const body = await response.json();

    expect(response.status()).toBe(406);
    expect(body).toHaveProperty('errorMessages', ['Unrecognised Accept Type']);
  });

  test('Create a todo accepting only XML. @POST', async ({ request }) => {
    const response = await request.post('/todos', {
      headers: {
        'x-challenger': token,
        accept: 'application/xml',
        'content-type': 'application/xml'
      },
      data: `
            <todo>
              <title>XML format</title>
              <doneStatus>true</doneStatus>
              <description>file paperwork today</description>
            </todo>
            `
    });
    const headers = await response.headers();

    expect(headers).toHaveProperty(
      'content-type',
      expect.stringContaining('application/xml')
    );
    expect(response.status()).toBe(201);
  });

  test('Create a todo accepting only JSON. @POST', async ({ request }) => {
    const response = await request.post('/todos', {
      headers: {
        'x-challenger': token,
        accept: 'application/json',
        'content-type': 'application/json'
      },
      data: {
        title: 'JSON format',
        description: 'json format only',
        doneStatus: true
      }
    });
    const body = await response.json();
    const headers = await response.headers();

    expect(headers).toHaveProperty(
      'content-type',
      expect.stringContaining('application/json')
    );
    expect(response.status()).toBe(201);
    expect(body).toEqual(
      expect.objectContaining({
        description: 'json format only',
        doneStatus: true,
        title: 'JSON format'
      })
    );
  });

  test(`Can't create a todo with unsupported content type`, async ({
    request
  }) => {
    const response = await request.post('/todos', {
      headers: {
        'x-challenger': token,
        'content-type': 'popi'
      },
      data: {
        title: 'Unsupported format',
        description: 'Unsupported format',
        doneStatus: true
      }
    });
    const body = await response.json();

    expect(response.status()).toBe(415);
    expect(body).toHaveProperty('errorMessages', [
      `Unsupported Content Type - popi`
    ]);
  });

  test('@GET user progress data', async ({ request }) => {
    const response = await request.get(`/challenger/${token}`, {
      headers: {
        'x-challenger': token
      }
    });
    const body = await response.json();

    expect(response.status()).toBe(200);
    expect(body).toHaveProperty('challengeStatus');
  });

  test(`Restore that challenger's progress into memory. @PUT`, async ({
    request
  }) => {
    const response = await request.put(`/challenger/${token}`, {
      headers: {
        'x-challenger': token
      },
      data: {
        xChallenger: token,
        secretNote: '',
        challengeStatus: {
          PUT_RESTORABLE_CHALLENGER_PROGRESS_STATUS: false,
          GET_TODOS: true,
          PUT_NEW_RESTORED_CHALLENGER_PROGRESS_STATUS: false,
          POST_TODOS: true,
          OVERRIDE_PATCH_HEARTBEAT_500: false,
          POST_TODOS_TOO_LONG_DESCRIPTION_LENGTH: true,
          GET_RESTORABLE_CHALLENGER_PROGRESS_STATUS: true,
          POST_SECRET_NOTE_401: false,
          PUT_TODOS_PARTIAL_200: true,
          GET_TODOS_FILTERED: true,
          GET_TODO_404: true,
          PUT_TODOS_400_NO_AMEND_ID: true,
          GET_HEARTBEAT_204: false,
          POST_TODOS_INVALID_EXTRA_FIELD: true,
          POST_SECRET_NOTE_BEARER_200: false,
          POST_CREATE_XML_ACCEPT_JSON: false,
          GET_ACCEPT_XML_PREFERRED: true,
          POST_SECRET_NOTE_200: false,
          CREATE_NEW_CHALLENGER: true,
          POST_UPDATE_TODO: true,
          GET_CHALLENGES: true,
          GET_HEAD_TODOS: true,
          POST_SECRET_NOTE_403: false,
          GET_RESTORABLE_TODOS: false,
          GET_ACCEPT_XML: true,
          POST_TODOS_415: true,
          GET_ACCEPT_JSON: true,
          CREATE_SECRET_TOKEN_201: false,
          OVERRIDE_DELETE_HEARTBEAT_405: false,
          POST_TODOS_BAD_DONE_STATUS: true,
          GET_SECRET_NOTE_200: false,
          OVERRIDE_TRACE_HEARTBEAT_501: false,
          POST_TODOS_404: true,
          POST_CREATE_JSON_ACCEPT_XML: false,
          GET_SECRET_NOTE_BEARER_200: false,
          GET_TODO: true,
          PUT_TODOS_FULL_200: true,
          GET_ACCEPT_ANY_DEFAULT_JSON: true,
          GET_SECRET_NOTE_401: false,
          POST_MAX_OUT_TITLE_DESCRIPTION_LENGTH: true,
          POST_CREATE_JSON: true,
          PATCH_HEARTBEAT_500: false,
          DELETE_A_TODO: true,
          DELETE_ALL_TODOS: false,
          POST_TODOS_TOO_LONG_PAYLOAD_SIZE: true,
          TRACE_HEARTBEAT_501: false,
          DELETE_HEARTBEAT_405: false,
          POST_ALL_TODOS: false,
          GET_SECRET_NOTE_403: false,
          PUT_TODOS_MISSING_TITLE_400: true,
          OPTIONS_TODOS: false,
          GET_JSON_BY_DEFAULT_NO_ACCEPT: true,
          POST_TODOS_TOO_LONG_TITLE_LENGTH: true,
          PUT_RESTORABLE_TODOS: false,
          GET_TODOS_NOT_PLURAL_404: true,
          POST_CREATE_XML: true,
          CREATE_SECRET_TOKEN_401: false,
          PUT_TODOS_400: true,
          GET_UNSUPPORTED_ACCEPT_406: true
        }
      }
    });
    const body = await response.json();

    expect(response.status()).toBe(200);
    expect(body).toEqual(
      expect.objectContaining({
        xChallenger: token,
        secretNote: '',
        challengeStatus: expect.any(Object)
      })
    );
  });

  test(`Get challenger GUID not currently in memory to restore that challenger's progress into memory. @PUT`, async ({
    request
  }) => {
    // Get newToken
    let newToken = faker.string.uuid();
    const getResponse = await request.get(`/challenger/${token}`, {
      headers: {
        'x-challenger': token
      }
    });
    const body = await getResponse.json();
    body['xChallenger'] = newToken;

    // Restore that challenger's progress into memory
    const response = await request.put(`/challenger/${newToken}`, {
      headers: {
        'x-challenger': newToken
      },
      data: body
    });

    expect(response.status()).toBe(201);
  });

  test('Retrieve the current todos database for the user. @GET', async ({
    request
  }) => {
    // Get todos list
    const getCurrentListTodos = await request.get('/todos', {
      headers: {
        'x-challenger': token
      }
    });
    const todos = await getCurrentListTodos.json();

    // Get todos from user
    const response = await request.get(`/challenger/database/${token}`, {
      headers: {
        'x-challenger': token
      }
    });
    const body = await response.json();

    expect(response.status()).toBe(200);
    expect(body.todos.length).toBe(todos.todos.length);
  });

  test('Restore the Todos database in memory. @PUT', async ({ request }) => {
    const response = await request.put(`/challenger/database/${token}`, {
      headers: {
        'x-challenger': token
      },
      data: {
        todos: [
          {
            id: 11,
            title: '111',
            doneStatus: true,
            description: '111'
          },
          { id: 4, title: '222' },
          {
            id: 17,
            title: 'XML format333',
            doneStatus: true,
            description: '333'
          },
          { id: 3, title: '444' },
          { id: 10, title: '444' },
          { id: 9, title: 'tidy 444' },
          { id: 8, title: '444' },
          { id: 7, title: '444' },
          { id: 5, title: '444' },
          { id: 2, title: '444' },
          { id: 6, title: '444' },
          {
            id: 15,
            title: '555',
            doneStatus: true,
            description: '666'
          }
        ]
      }
    });

    expect(response.status()).toBe(204);
  });

  test('Create a todo using XML but accept JSON. @POST', async ({
    request
  }) => {
    const response = await request.post(`/todos`, {
      headers: {
        'x-challenger': token,
        accept: 'application/json',
        'content-type': 'application/xml'
      },
      data: `
            <todo>
              <doneStatus>true</doneStatus>
              <title>JSON format should receive instead XML</title>
            </todo>
            `
    });
    const headers = await response.headers();

    expect(response.status()).toBe(201);
    expect(headers).toHaveProperty('content-type', 'application/json');
  });

  test('Create a todo using JSON but accept XML. @POST', async ({
    request
  }) => {
    const response = await request.post(`/todos`, {
      headers: {
        'x-challenger': token,
        accept: 'application/xml',
        'content-type': 'application/json'
      },
      data: {
        title: 'XML format should receive instead JSON',
        doneStatus: true,
        description: 'XML format should receive instead JSON'
      }
    });
    const headers = await response.headers();

    expect(response.status()).toBe(201);
    expect(headers).toHaveProperty('content-type', 'application/xml');
  });

  test('Check status code 405 (Method Not Allowed). @DELETE', async ({
    request
  }) => {
    const response = await request.delete(`/heartbeat`, {
      headers: {
        'x-challenger': token
      }
    });

    expect(response.status()).toBe(405);
  });

  test('Check status code 500 (internal server error). @PATCH', async ({
    request
  }) => {
    const response = await request.patch(`/heartbeat`, {
      headers: {
        'x-challenger': token
      }
    });

    expect(response.status()).toBe(500);
  });

  test('Check status code 204 (No Content). @GET', async ({ request }) => {
    const response = await request.get(`/heartbeat`, {
      headers: {
        'x-challenger': token
      }
    });

    expect(response.status()).toBe(204);
  });

  test('Simulate DELETE method as @POST', async ({ request }) => {
    const response = await request.post(`/heartbeat`, {
      headers: {
        'x-challenger': token,
        'X-HTTP-Method-Override': 'DELETE'
      }
    });

    expect(response.status()).toBe(405);
  });

  test('Simulate PATCH method as @POST', async ({ request }) => {
    const response = await request.post(`/heartbeat`, {
      headers: {
        'x-challenger': token,
        'X-HTTP-Method-Override': 'PATCH'
      }
    });

    expect(response.status()).toBe(500);
  });

  test('Simulate TRACE method as @POST', async ({ request }) => {
    const response = await request.post(`/heartbeat`, {
      headers: {
        'x-challenger': token,
        'X-HTTP-Method-Override': 'TRACE'
      }
    });

    expect(response.status()).toBe(501);
  });

  test(`"Authentication " User can't be authenticated via wrong (Basic64) credentials. @POST`, async ({
    request
  }) => {
    const response = await request.post(`/secret/token`, {
      headers: {
        'x-challenger': token,
        authorization: 'Basic dXNlcjpwYXNzd29yZA=='
      }
    });
    const headers = response.headers();

    expect(response.status()).toBe(401);
    expect(headers).toHaveProperty('www-authenticate');
  });

  test(`"Authentication " User can be authenticated via correct (Basic64) credentials. @POST`, async ({
    request
  }) => {
    const response = await request.post(`/secret/token`, {
      headers: {
        'x-challenger': token,
        authorization: 'Basic YWRtaW46cGFzc3dvcmQ='
      }
    });
    const headers = await response.headers();

    expect(response.status()).toBe(201);
    expect(headers).toHaveProperty('x-auth-token');
  });

  test(`"Authorization" Can't get data when X-AUTH-TOKEN does not match a valid token. @GET`, async ({
    request
  }) => {
    const response = await request.get(`/secret/note`, {
      headers: {
        'x-challenger': token,
        'x-auth-token': 'haha'
      }
    });

    expect(response.status()).toBe(403);
  });

  test(`"Authorization" Can't get data when no X-AUTH-TOKEN header present. @GET`, async ({
    request
  }) => {
    const response = await request.get(`/secret/note`, {
      headers: {
        'x-challenger': token
      }
    });

    expect(response.status()).toBe(401);
  });

  test('"Authorization" Get data when valid X-AUTH-TOKEN used. @GET', async ({
    request
  }) => {
    //User authentication
    const response = await request.post(`/secret/token`, {
      headers: {
        'x-challenger': token,
        authorization: 'Basic YWRtaW46cGFzc3dvcmQ='
      }
    });
    const headers = await response.headers();
    const xAuthToken = await headers['x-auth-token'];

    expect(response.status()).toBe(201);
    expect(headers).toHaveProperty('x-auth-token');

    //Access the secret
    const getResponse = await request.get(`/secret/note`, {
      headers: {
        'x-challenger': token,
        'x-auth-token': xAuthToken
      }
    });
    const body = await getResponse.json();

    expect(getResponse.status()).toBe(200);
    expect(body).toHaveProperty('note');
  });

  test('"Authorization" Create a note when valid X-AUTH-TOKEN present', async ({
    request
  }) => {
    //User authentication
    const authenResponse = await request.post(`/secret/token`, {
      headers: {
        'x-challenger': token,
        authorization: 'Basic YWRtaW46cGFzc3dvcmQ='
      }
    });
    const headers = await authenResponse.headers();
    const xAuthToken = await headers['x-auth-token'];

    expect(authenResponse.status()).toBe(201);
    expect(headers).toHaveProperty('x-auth-token');

    //Create my note via auth-token
    const response = await request.post(`/secret/note`, {
      headers: {
        'x-challenger': token,
        'x-auth-token': xAuthToken
      },
      data: { note: 'my note' }
    });
    const body = await response.json();

    expect(response.status()).toBe(200);
    expect(body.note).toEqual(expect.stringContaining('my note'));
  });

  test(`"Authorization" Can't create a note when no X-AUTH-TOKEN present. @POST`, async ({
    request
  }) => {
    const response = await request.post(`/secret/note`, {
      headers: {
        'x-challenger': token
      },
      data: { note: 'my note' }
    });

    expect(response.status()).toBe(401);
  });

  test(`"Authorization" Can't create a note when X-AUTH-TOKEN does not match a valid token. @POST`, async ({
    request
  }) => {
    const response = await request.post(`/secret/note`, {
      headers: {
        'x-challenger': token,
        'x-auth-token': 'haha'
      },
      data: { note: 'my note' }
    });

    expect(response.status()).toBe(403);
  });

  test('"Bearer" Get data when using the X-AUTH-TOKEN value as an Authorization Bearer token. @GET', async ({
    request
  }) => {
    // User authentication
    const authenResponse = await request.post(`/secret/token`, {
      headers: {
        'x-challenger': token,
        authorization: 'Basic YWRtaW46cGFzc3dvcmQ='
      }
    });
    const headers = await authenResponse.headers();
    const xAuthToken = await headers['x-auth-token'];

    expect(authenResponse.status()).toBe(201);
    expect(headers).toHaveProperty('x-auth-token');

    // Get note via bearer authorization
    const getResponse = await request.get(`/secret/note`, {
      headers: {
        'x-challenger': token,
        authorization: `Bearer ${xAuthToken}`
      }
    });
    const body = await getResponse.json();

    expect(getResponse.status()).toBe(200);
    expect(body).toHaveProperty('note');
  });

  test(`"Bearer" Create a note when valid X-AUTH-TOKEN value used as an Authorization Bearer token. @GET`, async ({
    request
  }) => {
    // User authentication
    const authenResponse = await request.post(`/secret/token`, {
      headers: {
        'x-challenger': token,
        authorization: 'Basic YWRtaW46cGFzc3dvcmQ='
      }
    });
    const headers = await authenResponse.headers();
    const xAuthToken = await headers['x-auth-token'];

    expect(authenResponse.status()).toBe(201);
    expect(headers).toHaveProperty('x-auth-token');

    // Create note via bearer authorization
    const response = await request.post(`/secret/note`, {
      headers: {
        'x-challenger': token,
        authorization: `Bearer ${xAuthToken}`
      },
      data: { note: 'my note edited bearer' }
    });
    const body = await response.json();

    expect(response.status()).toBe(200);
    expect(body).toHaveProperty('note', 'my note edited bearer');
  });

  test('@DELETE all the todos in the system', async ({ request }) => {
    // Get todos list
    const getResponse = await request.get('/todos', {
      headers: {
        'x-challenger': token
      }
    });
    const todos = await getResponse.json();

    // Delete each todo one at a time via cycle
    for (const todo of todos.todos) {
      const deleteResponse = await request.delete(`/todos/${todo.id}`, {
        headers: {
          'x-challenger': token
        }
      });
      expect(deleteResponse.status()).toBe(200);
    }

    // Check whether all todos have been deleted
    const finalGetResponse = await request.get('/todos', {
      headers: {
        'x-challenger': token
      }
    });
    const finalTodos = await finalGetResponse.json();
    expect(finalTodos.todos.length).toBe(0);
  });

  test('Create maximum number of TODOS allowed for a user. @POST', async ({
    request
  }) => {
    // Get todos list
    const getCurrentListTodos = await request.get('/todos', {
      headers: {
        'x-challenger': token
      }
    });
    const todos = await getCurrentListTodos.json();

    // Create maximum (20) todos via cycle
    const todosCreate = 20 - todos.todos.length;

    for (let i = 0; i < todosCreate; i++) {
      const createTodo = await request.post(`/todos`, {
        headers: {
          'x-challenger': token
        },
        data: {
          title: `Todo ${i + 1}`,
          description: `Description ${i + 1}`
        }
      });

      expect(createTodo.status()).toBe(201);
    }

    // Create a to do to throw it over the edge
    const createOverTodo = await request.post(`/todos`, {
      headers: {
        'x-challenger': token
      },
      data: {
        title: `Todo Over`,
        description: `Description Over`
      }
    });
    const errorResponse = await createOverTodo.json();

    expect(createOverTodo.status()).toBe(400);
    expect(errorResponse).toHaveProperty('errorMessages', [
      'ERROR: Cannot add instance, maximum limit of 20 reached'
    ]);

    // Check whether all todos are created
    const getFullListTodos = await request.get('/todos', {
      headers: {
        'x-challenger': token
      }
    });
    const finalTodos = await getFullListTodos.json();

    expect(finalTodos.todos.length).toBe(20);
  });
});
