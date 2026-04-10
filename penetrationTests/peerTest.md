# Peer Penetration Testing

**Peers:** Jackson Gray and Shayla McMillan

---

## Self Attacks
---

### Shayla McMillan

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

---

## Peer Attacks



### Shayla McMillan attack on Jackson Gray

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
