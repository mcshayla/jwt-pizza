import { test, expect } from 'playwright-test-coverage';
import type { Page } from '@playwright/test';

type User = {
  id: string;
  name: string;
  email: string;
  password: string;
  roles: { role: string}[];
}

async function basicInit(page: Page) {
  let loggedInUser: User | undefined;
  const validUsers: Record<string, User> = { 'd@jwt.com': { id: '3', name: 'Kai Chen', email: 'd@jwt.com', password: 'a', roles: [{ role: 'diner' }] },  'a@jwt.com': {
      id: '1',
      name: '常用名字',
      email: 'a@jwt.com',
      password: 'admin',
      roles: [{ role: 'admin' }]
    } };

  const createdStores: Record<number, any[]> = {};

  // Authorize login for the given user
  await page.route('*/**/api/auth', async (route) => {
    const method = route.request().method();
    const requestData = route.request().postDataJSON();

    if(method === 'PUT') {
      const user = validUsers[requestData.email];
      if (!user || user.password !== requestData.password) {
        await route.fulfill({ status: 401, json: { error: 'Unauthorized' } });
        return;
      }
      loggedInUser = validUsers[requestData.email];
      const loginRes = {
        user: {
          id: Number(user.id),
          name: user.name,
          email: user.email,
          roles: user.roles
        },
        token: user.password === 'admin' 
          ? 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MSwibmFtZSI6IuW4uOeUqOWQjeWtlyIsImVtYWlsIjoiYUBqd3QuY29tIiwicm9sZXMiOlt7InJvbGUiOiJhZG1pbiJ9XSwiaWF0IjoxNzcwNzQ0MzYwfQ.v9TvzErs0gUhAD1NYYXib9acStMLQCdBZtU5YxK0U88'
          : 'abcdef'
      };
      await route.fulfill({ json: loginRes });
    } else if (method === 'POST') {
      const newUser: User = {
      id: String(Object.keys(validUsers).length + 1),
      name: requestData.name,
      email: requestData.email,
      password: requestData.password,
      roles: [{ role: 'diner' }]
      };
      validUsers[requestData.email] = newUser;
      loggedInUser = newUser;
      await route.fulfill({ 
        json: { 
          user: newUser, 
          token: 'abcdef' 
        } 
    });
    } else if (method === 'DELETE') {
      loggedInUser = undefined;
      await route.fulfill({ 
        json: { message: 'logout successful' } 
      });
    }
  });

  // Return the currently logged in user
  await page.route('*/**/api/user/me', async (route) => {
    expect(route.request().method()).toBe('GET');
    await route.fulfill({ json: loggedInUser });
  });


  await page.route(/\/api\/franchise\/\d+\/store(\?.*)?$/, async (route) => {
    const method = route.request().method();

    if (method === 'POST') {
      const storeData = route.request().postDataJSON();
      const franchiseId = parseInt(route.request().url().split('/')[5]);
      const newStore = {
        id: Math.floor(Math.random() * 1000),
        name: storeData.name,
        franchiseId: franchiseId,
        totalRevenue: 0
      };
      
      if (!createdStores[franchiseId]) {
        createdStores[franchiseId] = [];
      }
      createdStores[franchiseId].push(newStore);
      
      await route.fulfill({ json: newStore });
    }
  });

  // Get user franchises: GET /api/franchise/:userId
  await page.route(/\/api\/franchise\/\d+$/, async (route) => {
    const method = route.request().method();
    const userId = parseInt(route.request().url().split('/')[5]);

    if (method === 'GET') {
      // Return franchises for this user with their stores
      const userFranchises = [
        {
          id: 1150,
          name: 'Test Franchise',
          admins: [{ id: 1, name: "常用名字", email: "a@jwt.com" }],
          stores: createdStores[1150] || []
        },
        {
          id: 1156,
          name: 'TEST TEST 4',
          admins: [{ id: 1, name: "常用名字", email: "a@jwt.com" }],
          stores: createdStores[1156] || [{id: 999, name: 'TEST STORE'}]
        },
      ];
      await route.fulfill({ json: userFranchises });
    }
  });

  //create franchise
  // await page.route('*/**/api/franchise', async (route) => {
  await page.route(/\/api\/franchise(\?.*)?$/, async (route) => {
    const method = route.request().method();

    if (method === 'GET') {
      const franchiseRes = {
      franchises: [
        {
          id: 1156,
          name: 'TEST TEST',
          admins: [
            {
              id: 1,
              name: "常用名字",
              email: "a@jwt.com"
            }
          ],
          stores: [{id: 999, name: 'TEST STORE'}],
        },
        {
          id: 2,
          name: 'LotaPizza',
          stores: [
            { id: 4, name: 'Lehi' },
            { id: 5, name: 'Springville' },
            { id: 6, name: 'American Fork' },
          ],
        },
        { id: 3, name: 'PizzaCorp', stores: [{ id: 7, name: 'Spanish Fork' }] },
        { id: 4, name: 'topSpot', stores: [] },
      ],
      more: false
    };
    await route.fulfill({ json: franchiseRes });
    } else if (method === 'POST') {
       expect(route.request().method()).toBe('POST');
      await route.fulfill({ json: {
        "stores": [],
        "id": 1156,
        "name": "TEST TEST",
        "admins": [
          {
            "email": "a@jwt.com",
            "id": 1,
            "name": "常用名字"
          }
        ]
      } });
    }
   
  });
  

  // A standard menu
  await page.route('*/**/api/order/menu', async (route) => {
    const menuRes = [
      {
        id: 1,
        title: 'Veggie',
        image: 'pizza1.png',
        price: 0.0038,
        description: 'A garden of delight',
      },
      {
        id: 2,
        title: 'Pepperoni',
        image: 'pizza2.png',
        price: 0.0042,
        description: 'Spicy treat',
      },
    ];
    expect(route.request().method()).toBe('GET');
    await route.fulfill({ json: menuRes });
  });

  //updateUser
  await page.route('*/**/api/user/*', async (route) => {
    const orderReq = route.request().postDataJSON();
    const method = route.request().method();

    if (method === 'PUT') {
      const body = route.request().postDataJSON();
      const oldEmail = loggedInUser!.email;
      
      const updatedUser = {
        ...validUsers[oldEmail],
        ...body,
        password: body.password || validUsers[oldEmail].password
      };

      // Remove old key, add new key (in case email changed)
      delete validUsers[oldEmail];
      validUsers[updatedUser.email] = updatedUser;
      loggedInUser = updatedUser;

      await route.fulfill({ 
        json: { user: updatedUser, token: 'abcdef' } 
      });
    }
  });

  // Order a pizza.
  await page.route('*/**/api/order', async (route) => {
    const orderReq = route.request().postDataJSON();
    const method = route.request().method();

    if (method === 'GET') {
      await route.fulfill({ 
        json: {
          dinerId: Number(loggedInUser?.id) || 0,
          orders: [],
          page: 1
        }
      });
    } else if (method === 'POST') {

      const orderRes = {
        order: { ...orderReq, id: 23 },
        jwt: 'eyJpYXQ',
      }
     await route.fulfill({ json: orderRes });
    }
  });

  await page.goto('/');
}

async function loginAsAdmin(page: Page) {
  await page.getByRole('link', { name: 'Login' }).click();
  await page.getByRole('textbox', { name: 'Email address' }).fill('a@jwt.com');
  await page.getByRole('textbox', { name: 'Password' }).fill('admin');
  await page.getByRole('button', { name: 'Login' }).click();
  await expect(page.getByRole('link', { name: 'Admin' })).toBeVisible();
}

async function loginAsDiner(page: Page) {
  await page.getByRole('link', { name: 'Login' }).click();
  await page.getByRole('textbox', { name: 'Email address' }).fill('d@jwt.com');
  await page.getByRole('textbox', { name: 'Password' }).fill('a');
  await page.getByRole('button', { name: 'Login' }).click();
  await expect(page.getByRole('link', { name: 'KC' })).toBeVisible();
}



test('updateUserName', async ({ page }) => {
  await basicInit(page);
  await loginAsDiner(page);
  await page.getByRole('link', { name: 'KC' }).click();
  await expect(page.getByRole('main')).toContainText('Kai Chen');
  await page.getByRole('button', { name: 'Edit' }).click();
  await expect(page.locator('h3')).toContainText('Edit user');
  await page.getByRole('textbox').first().fill('pizza dinerx');
  await page.getByRole('button', { name: 'Update' }).click();
  await page.waitForSelector('[role="dialog"].hidden', { state: 'attached' });
  await page.getByRole('link', { name: 'Logout' }).click();
  await page.getByRole('link', { name: 'Login' }).click();
  await page.getByRole('textbox', { name: 'Email address' }).fill('d@jwt.com');
  await page.getByRole('textbox', { name: 'Password' }).fill('a');
  await page.getByRole('button', { name: 'Login' }).click();
  await page.getByRole('link', { name: 'pd' }).click();
  await expect(page.getByRole('main')).toContainText('pizza dinerx');
});


test('updateUserEmail', async ({ page }) => {
  await basicInit(page);
  await loginAsDiner(page);
  await page.getByRole('link', { name: 'KC' }).click();
  await expect(page.getByRole('main')).toContainText('Kai Chen');
  await page.getByRole('button', { name: 'Edit' }).click();
  await expect(page.locator('h3')).toContainText('Edit user');
  await page.getByRole('textbox').nth(1).fill('test@gmail.com');
  await page.getByRole('button', { name: 'Update' }).click();
  await page.waitForSelector('[role="dialog"].hidden', { state: 'attached' });
  await page.getByRole('link', { name: 'Logout' }).click();
  await page.getByRole('link', { name: 'Login' }).click();
  await page.getByRole('textbox', { name: 'Email address' }).fill('test@gmail.com');
  await page.getByRole('textbox', { name: 'Password' }).fill('a');
  await page.getByRole('button', { name: 'Login' }).click();
  await page.getByRole('link', { name: 'KC' }).click();
  await expect(page.getByRole('main')).toContainText('test@gmail.com');
});

test('updateUserPassword', async ({ page }) => {
  await basicInit(page);
  await loginAsDiner(page);
  await page.getByRole('link', { name: 'KC' }).click();
  await expect(page.getByRole('main')).toContainText('Kai Chen');
  await page.getByRole('button', { name: 'Edit' }).click();
  await expect(page.locator('h3')).toContainText('Edit user');
  await page.getByRole('textbox').nth(2).fill('newPassword');
  await page.getByRole('button', { name: 'Update' }).click();
  await page.waitForSelector('[role="dialog"].hidden', { state: 'attached' });
  await page.getByRole('link', { name: 'Logout' }).click();
  await page.getByRole('link', { name: 'Login' }).click();
  await page.getByRole('textbox', { name: 'Email address' }).fill('d@jwt.com');
  await page.getByRole('textbox', { name: 'Password' }).fill('newPassword');
  await page.getByRole('button', { name: 'Login' }).click();
  await page.getByRole('link', { name: 'KC' }).click();
  await expect(page.getByRole('main')).toContainText('Kai Chen');
});


test('getUsersList', async ({ page }) => {
  await basicInit(page);
  await loginAsAdmin(page);
  await page.getByRole('link', { name: 'Admin' }).click();
  await page.getByRole('heading', { name: 'Users List' }).click();
  await page.getByRole('textbox', { name: 'Filter Users List' }).fill('a');
  await page.getByTestId('submit-users-filter').click();
  await page.getByRole('cell', { name: 'a' }).nth(3).click();
});


