
# ImHere

Attendance tracking with a click—for organizers and teachers with statistics and geo-location verification.

## Run Locally

Clone the project

```bash
  git clone https://github.com/Mattgoods/swamp-kings
```

Go to the project directory

```bash
  cd swamp-kings
  cd im-here
```

Install dependencies

```bash
  npm install
```

Start the server

```bash
  npm run dev
```



## Using the project

#### Site should be running at: [http://localhost:5173](http://localhost:5173)

#### Organizer login

```bash
  Email: readme@readme.com
  Password: readme123
```


    
## Firebase Reference

#### Login

```bash
  Email: swampkingsuf@gmail.com
  Password: swampkingsuf101
```

#### Edit here to use your own account / information

```bash
  im-here/src/firebase/firebase.js
```
## Database Schema

### Groups Table
| Field          | Type        | Description                                         |
|----------------|-------------|-----------------------------------------------------|
| groupId        | String      | Unique identifier for the group                    |
| groupName      | String      | Name of the group                                  |
| organizerId    | String      | Reference to `Users` table (organizer's ID)        |
| organizerName  | String      | Name of the organizer                              |
| meetingDays    | Array       | Days the group meets                               |
| meetingTime    | String      | Time the group meets                               |
| location       | String      | Location of the meeting                            |
| startDate      | Date        | Start date for the group meetings                 |
| endDate        | Date        | End date for the group meetings                   |
| semester       | String      | Semester of the group                              |
| createdAt      | Timestamp   | Timestamp for when the group was created           |

### ClassHistory Table 
| Field          | Type        | Description                                         |
|----------------|-------------|-----------------------------------------------------|
| date           | Date        | Date of the class                                  |
| attendees      | Array       | List of attendees for the class                   |
| totalStudents  | Integer     | Total number of students in the class              |
| isLive         | Boolean     | Whether the class was live or not                  |
| ended          | Boolean     | Whether the class has ended                        |

### Users Table
| Field          | Type        | Description                                         |
|----------------|-------------|-----------------------------------------------------|
| uid            | String      | Unique user ID                                     |
| fullName       | String      | Full name of the user                              |
| email          | String      | User's email address                               |
| role           | String      | Role of the user (e.g., Attendee, Organizer)       |
| createdAt      | Timestamp   | Timestamp for when the user was created            |
| groups         | Array       | List of group IDs the user belongs to              |

### Organizers Table
| Field          | Type        | Description                                         |
|----------------|-------------|-----------------------------------------------------|
| uid            | String      | Unique teacher ID                                  |
| fullName       | String      | Full name of the teacher                           |
| email          | String      | Teacher's email address                            |
| role           | String      | Role (e.g., Organizer)                             |
| createdAt      | Timestamp   | Timestamp for when the teacher was created         |
| groups         | Array       | List of group IDs the teacher is associated with   |

## Authors

- [@Mattgoods](https://github.com/Mattgoods)
- [@BroganTagman](https://github.com/BroganTagman)
- [@msawarynski](https://github.com/msawarynski)
- [@bnbaltz](https://github.com/bnbaltz)
- [@LeakyMon](https://github.com/LeakyMon)

