
## Reporters ##
Jackson Gray
Shayla McMillan

## Self Attacks ##

Jackson Gray

| Item           | Result                                                                         |
| -------------- | ------------------------------------------------------------------------------ |
| Date           | April 9, 2026                                                                  |
| Target         | PUT /api/auth                                                                  |
| Classification | Identification and Authentication Failures                                     |
| Severity       | 2                                                                              |
| Description    | A user is able to sign in to an account when a password is not included in the request.                |
| Corrections    | Set a check for password to not be null                                        |

| Item           | Result                                                                         |
| -------------- | ------------------------------------------------------------------------------ |
| Date           | April 9, 2026                                                                  |
| Target         | PUT /api/order                                                                 |
| Classification | Mishandled Exceptions                                                          |
| Severity       | 4                                                                              |
| Description    | When a parameter is missing from an order, no exception is handled.            |
| Corrections    | Return request when parameters are missing                                     |

| Item           | Result                                                                         |
| -------------- | ------------------------------------------------------------------------------ |
| Date           | April 9, 2026                                                                  |
| Target         | DELETE /api/user/:userId                                                       |
| Classification | Broken Access Control                                                          |
| Severity       | 2                                                                              |
| Description    | Any user can delete other users                                                |
| Corrections    | Set a check for admin priveleges in user delete                                |

| Item           | Result                                                                         |
| -------------- | ------------------------------------------------------------------------------ |
| Date           | April 9, 2026                                                                  |
| Target         | DELETE /api/franchise/:franchiseId                                             |
| Classification | Broken Access Control                                                          |
| Severity       | 2                                                                              |
| Description    | There is no auth check for deleting a franchise                                |
| Corrections    | Set a check auth check within the method                                       |

| Item           | Result                                                                         |
| -------------- | ------------------------------------------------------------------------------ |
| Date           | April 9, 2026                                                                  |
| Target         | POST /api/auth                                                                 |
| Classification | Identification and Authentication Failures                                     |
| Severity       | 1                                                                              |
| Description    | Multiple users can be created with the same email                              |
| Corrections    | Set a check for duplicate emails                                               |

Shayla McMillan

**Attack 1**

| Item | Result |
|------|--------|
| Date | April 9, 2026 |
| Target | DELETE /api/franchise/:franchiseId|
| Classification | Broken Access Control |
| Severity | 3 |
| Description | Authorization was escalated to administrator level. A user that was not an admin could have admin access and delete a store with their authorization: bearer.|
| Images | ![Franchise deleted without admin](franchise%20deleted%20without%20admin.png) |
| Corrections | if (!req.user.isRole(Role.Admin)) throw new StatusCodeError('unable to delete a franchise', 403); |

**Attack 2**

| Item | Result |
|------|--------|
| Date | April 9, 2026|
| Target | PUT /api/user/7|
| Classification | Injection |
| Severity | 3 |
| Description | Significant data could have been altered because I could do a SQL injection and update the users table. |
| Images | ![sql injection](sql_injection.png)
| Corrections | I used ? and a parameter to only treat it as text than accepting any text and treating it as a sql command if written properly. |

**Attack 3**

| Item | Result |
|------|--------|
| Date | 04/09/2026|
| Target |POST /api/auth |
| Classification |Identification and Authentication Failures |
| Severity | 3|
| Description | Admin password was just visible in the repo. Anyone could access it on github |
| Images |![password](password_seen.png) |
| Corrections |I deleted the password to no longer be hardcoded in the code.|

**Attack 4**

| Item | Result |
|------|--------|
| Date |04/09/2026|
| Target |any endpoint|
| Classification | Security Misconfiguration |
| Severity | 1 |
| Description | This could lead to a much higher security attack. I sent through a bad request on purpose and I recieved the entire stack of code which shows me apis to call and the code. |
| Images | ![stack](see_the_code.png) |
| Corrections | I now only return the stack trace if it's not in production |

**Attack 5**

| Item | Result |
|------|--------|
| Date | 04/09/2026 |
| Target | JWT payload |
| Classification | Cryptographic Failures |
| Severity | 2 |
| Description | Customer details like their name, roles, and email can easily be decoded with the JWT token |
| Images | ![jwt token](jwt_decoded.png) |
| Corrections | I changed it so the whole user is not passed into the the token, only the id and role. |

## Peer Attacks ##

Jackson's attack on Shayla

| Item           | Result                                                                         |
| -------------- | ------------------------------------------------------------------------------ |
| Date           | April 10, 2026                                                                  |
| Target         | PUT /api/auth                                                                  |
| Classification | Identification and Authentication Failures                                     |
| Severity       | 2                                                                              |
| Description    | A user is able to sign in to an account when a password is not included in the request.  |
| Corrections    | I was able to successfully login with an existing user without using a correct password. |

| Item           | Result                                                                         |
| -------------- | ------------------------------------------------------------------------------ |
| Date           | April 10, 2026                                                                  |
| Target         | PUT /api/order                                                                 |
| Classification | Mishandled Exceptions                                                          |
| Severity       | 0                                                                              |
| Description    | When a parameter is missing from an order, no exception is handled.            |
| Corrections    | I was unsuccessful to shut down the server in this way becuase there was a null check for the passed SQL. |

| Item           | Result                                                                         |
| -------------- | ------------------------------------------------------------------------------ |
| Date           | April 10, 2026                                                                  |
| Target         | DELETE /api/user/:userId                                                       |
| Classification | Broken Access Control                                                          |
| Severity       | 0                                                                              |
| Description    | Any user can delete other users.                                               |
| Corrections    | I was unsuccessful in doing this as there was an auth check for doing this action. |

| Item           | Result                                                                         |
| -------------- | ------------------------------------------------------------------------------ |
| Date           | April 10, 2026                                                                  |
| Target         | PUT /api/user/:userId                                                          |
| Classification | Broken Access Control                                                          |
| Severity       | 0                                                                              |
| Description    | Any user can edit another user's info.                                         |
| Corrections    | I was unsucessful in changing the admin's information from another user.       |

| Item           | Result                                                                         |
| -------------- | ------------------------------------------------------------------------------ |
| Date           | April 10, 2026                                                                  |
| Target         | GET /api/user/me                                                               |
| Classification | Insecure Design                                                                |
| Severity       | 0                                                                              |
| Description    | Any user can elevate their role using edit.                                    |
| Corrections    | I was unsucessful in changing the role of a user to admin thorugh manipulating the request sent when editing.       |

| Item           | Result                                                                         |
| -------------- | ------------------------------------------------------------------------------ |
| Date           | April 10, 2026                                                                  |
| Target         | POST /api/auth                                                                 |
| Classification | Identification and Authentication Failures                                     |
| Severity       | 1                                                                              |
| Description    | Multiple users can be created with the same email.                             |
| Corrections    | I was successfully able to create another user with the admin email a@jwt.com by creating another user with this email.  |

Shayla's attacks on Jackson

**Attack 1**

| Item | Result |
|------|--------|
| Date | 04/10/2026|
| Target |POST /api/auth |
| Classification |Identification and Authentication Failures |
| Severity | 3 |
| Description | Admin password was just visible in the repo. Anyone could access it on github. Look database.js where if (dbExists).... I was able to just login as an admin. |
| Corrections | I suggest removing these credenitals and using a random password if db doesn't exist or using secret keys. |

**Attack 2**

| Item | Result |
|------|--------|
| Date | April 10, 2026|
| Target | PUT /api/user/7|
| Classification | Injection |
| Severity | 3 |
| Description | Significant data could have been altered because I could do a SQL injection and update the users table. I used my user authorization token and id to send a put request: PUT /api/user/28 HTTP/2. The request parameter I sent were: ` {"name": "TestName', name='InjectedName", "email": "shayla@gmail.com", "password":
  "shayla"} ` and the response I recieved was: `{"user":{"id":28,"name":"InjectedName","email":"shayla@gmail.com","roles":[{"role":"diner"}]},"token":"eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MjgsIm5hbWUiOiJJbmplY3RlZE5hbWUiLCJlbWFpbCI6InNoYXlsYUBnbWFpbC5jb20iLCJyb2xlcyI6W3sicm9sZSI6ImRpbmVyIn1dLCJpYXQiOjE3NzU4NTI5NjN9.KKrMBY_6vvXRB_zPmXrvDmPW0Ti0a4lBeiWbXd5PF1s" `. This shows that this api call accepts sql injections.  |
| Corrections | Use ? in the db call and add a parameter id, that will replace that ? and treat it only as a string whatever it is. |


**Attack 3**

| Item | Result |
|------|--------|
| Date |04/09/2026|
| Target |any endpoint|
| Classification | Security Misconfiguration |
| Severity | 0 - attack failed |
| Description | I attempted to send through improper request parameters hoping that it would throw an error and I could see the stack trace and code. Unfortunately, I found that I couldn't see the stack trace in production. |
| Corrections | Well done. |

**Attack 4**

| Item | Result |
|------|--------|
| Date | 04/10/2026 |
| Target | JWT payload |
| Classification | Cryptographic Failures |
| Severity | 2 |
| Description | Customer details like their name, roles, and email can easily be decoded with the JWT token. I used jwt.io to decode the key.  |
| Corrections | This isn't major but I think it would be better if the key only had the role and the id rather than including the name and the email. |

**Attack 5**

| Item | Result |
|------|--------|
| Date | April 10, 2026 |
| Target | DELETE /api/franchise/:franchiseId|
| Classification | Broken Access Control |
| Severity | 0 - attack failed |
| Description | I attempted to delete a franchise without having the proper admin role. This was unsuccessful. ||
| Corrections | well done! attack failed |
---

## Combined Summary of Learnings
Through this experience we learned the importance of thinking like a penetration tester as we write code. Highlights of what we learned:
- SQL injections are easy to do but also easy to prevent if we are cautious on what we accept as parameters
- Repeater tool in burp was easy to send api calls attempting to do attacks.
- It's always important to check who as user is, what roles they have, and why they are trying to do the action they are trying to do (and then prevent them if unreasonable)
- with the request and response headers in the dev tools, we can learn a lot about one's code just from the browser.
- If one's repository is public, we can learn a lot about their code and create attacks from that.
- null checks prevent the server from not handling exceptions resulting in a server shutdown