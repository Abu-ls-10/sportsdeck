CSC309:Programming on the Web
University of Toronto Mississauga - Winter 2026
pp1 Handout
View fullscreen 
SportsDeck: The Ultimate Hub for Sports Fans!
SportsDeck is a modern and interactive web application tailored for sports enthusiasts. It centralizes the scattered sports fanbase into a single platform dedicated to a major sports league of your choice. SportsDeck offers a unified space for fans to engage in discussions, share their enthusiasm, and stay updated with real-time information about their favorite teams and matches.



About the Project
This project is described from the perspective of a business owner with limited technical knowledge of concepts like web development, Next.js, and APIs. The requirements are intentionally presented in non-technical terms, and your task is to design and implement a web application that fulfills them. You have significant creative freedom in the details and tools you use for this project. However, you must use Next.js, Prisma, REST, React, TailwindCSS, and Docker. Beyond these, you are encouraged to leverage any existing packages, libraries, or open-source code to enhance your application.

This project is designed to provide you with an immersive experience in state-of-the-art web development. From AI features to real-world data, API integrations, and deployment challenges, this project will offer valuable insights to practically apply what you have learned in the course and can serve as a highlight on your resume.

The project is divided into two parts. In Part 1, you will use Next.js and Prisma to implement the RESTful backend of the project. In Part 2, you will develop the frontend using React and TailwindCSS and connect it to the backend. You will also use Docker to make your full application portable and deployable on the internet. The final deliverable is a deployed, portable, and fully functional web application that meets the user stories outlined in the upcoming sections.

Groups
This project is designed for groups of three members. Groups of two are acceptable if some members have prior web development experience. Working individually is an option but is strongly discouraged due to the significant workload.

Note: The number of group members will not affect the grading criteria. Submissions will be evaluated equally, regardless of team size.

UTBook
All project-related activities—such as team registration, code submission, and interview scheduling—will be managed through UTBook. We do not use Markus for the project. Begin by logging into UTBook and registering your group. To register, invite your teammates using the system’s group management feature. Once your group is registered, a GitLab repository will automatically be created for your team. Use this repository to push your code throughout the project. Monitor Piazza for detailed instructions on using UTBook.

Deadline
The submission deadline for Part 1 is Friday, March 6th, at 22:00. Late submissions will incur a 10% penalty per day, up to a maximum of three days.

Students registered with Accessibility Services may qualify for deadline extensions. In such cases, submit an extension request using the SCR form. Note that individual entitlements will be adjusted based on the size of the team. For example, if one member from a team of two is entitled to 7 days of extensions, the team will be granted ⌈7 ÷ 2⌉ = 4 days.

Academic Integrity
Honesty and fairness are fundamental to the University of Toronto's mission. Plagiarism is a form of academic fraud and is treated very seriously.

You are also expected to read the handout How Not to Plagiarize and to be familiar with the Code of Behavior on Academic Matters.

You are allowed to search the internet, use online resources, open-source codes, and generative AI (e.g., ChatGPT) to help you with the project. However, sharing any portion of code with other teams, whether giving or receiving, is strictly prohibited.

Note that all work that was not written by you or your teammates must be cited in the code, including open-source codes and code created by generative AI. Be sure to read the Generative AI and Academic Integrity guidelines on the proper use of generative AI in your academic work.

Mentor sessions
You can attend mentor sessions with a TA to discuss your ideas, ask questions, or seek help on any project-related issue. Note that the total number of sessions is limited and will be filled on a first-come, first-served basis. Details on how to find a session will be posted on Piazza.

Interviews
Each part will be graded separately through interview sessions with TAs. Attending the interview is mandatory to obtain marks for the project. All team members must be present at the meeting; absent members will not receive any marks for that part. Instructions on booking interviews will be announced on Piazza.

TAs will clone your code from UTBook and attempt to run it from scratch on their own machines. Ensure that your submitted code is ready to run without any issues.

Participation
Each team member is expected to contribute fairly to this project. Participation will be assessed by reviewing the commits made by each member and asking detailed questions about the code during the interviews. While this is a group project, your final grade will be determined individually.

Submission
Submit your work to your group's GitLab repository on UTBook. You can find your repository's URL by logging into UTBook. Note that there is a separate repository for each part of the project.

Proper use of git is part of your evaluation. Commit your changes regularly whenever a small, logical change is made. Avoid leaving all your commits until the last minute before the deadline. Always write clear and informative commit messages.

Environment
Your application must run on an Ubuntu 22.04 machine with Node.js 20+ and SQLite3 installed. While you may develop your code on other operating systems (Windows is strongly discouraged), it is your responsibility to ensure that your submitted code and scripts work seamlessly on the described environment.

Third-party APIs
External Sports API
To implement this project, you will need to integrate with an external sports API to access real-time data for leagues, teams, matches, and scores. It is your responsibility to find an API provider that meets the project requirements. The data must be real-time, not live—this means it should include matches played up to the previous day but does not need to show data for matches currently in progress.

A good free option is football-data.org, which provides data for major football leagues. Its free plan includes standings, matches, and scores, which are sufficient for this project.

Important note: You can assume that data related to the past will never change. For example, the list of teams in a league, the league's structure, and scores of past games will not change. The only real-time data are the standings/tables, new scores, and newly scheduled matches.

AI Inference Providers
For AI-powered features, such as sentiment analysis or content moderation, you will need to integrate with an AI inference provider. The choice of API provider and models is up to you. A popular option is Hugging Face, which offers a wide range of pre-trained models for various tasks. Their inference APIs can be used to add intelligent features to your application. Many smaller models on Hugging Face (e.g., translation, LLM) are virtually free and will not exceed the free $0.10 monthly credit.

Important note: For this course, you are only allowed to interact with the inference APIs of the providers. You cannot load models or host inference servers locally.

Important note 2: We understand that most free inference APIs have a mediocre quality. We will not be strict on the quality of your AI inference. However, it should return decent results most of time.

API Authorization
Most third-party APIs require an API key for authentication, which is typically included in the request headers. Ensure your API key is kept secure and is not exposed in your frontend code or committed directly into your git history. Use a .env file to manage sensitive credentials.

Important note: Users must never directly interact with the external sports API. All communication with the API must go through your backend server to protect your API key. Your backend must act as a proxy, fetching data from the sports API and sending it to the frontend.

Cost-Effective Development: Free Tiers and Caching
Managing costs associated with third-party services is a key challenge in web development. For this project, you must use the free tiers of any external APIs you integrate with, including both the sports API and AI inference providers. Do not use any paid services.

Free tiers often have limits on the number of requests and available features. To stay within these limits and improve performance, you must implement caching for all external API data. For example, if a user refreshes a match page 10 times, your app should not send the same request to the external API 10 times—this would waste resources.

It is up to you how to cache this data. You can store particular pieces of it in the database and use a simple, in-memory cache for other parts.

Important note: Your app should not stop working because you exceeded certain limits or quotas. Avoid API providers with restrictive free plans (e.g., 100 requests per day, 10 per hour, or 20K tokens per day). During interviews, your app will be tested with a reasonable number of requests. A well-implemented caching strategy is expected to ensure smooth functionality.

SportsDeck Features
The following sections describe the features to be implemented in SportsDeck. These features are presented as user stories to illustrate the experience from the perspective of hypothetical users. Each story is intentionally written in non-technical terms, allowing you the flexibility to determine the specific design and implementation details.

To begin, you must select a major sports league (e.g., UEFA Champions League, Premier League, La Liga, NBA, NFL, NHL, MLB) as the focus of your SportsDeck implementation. All features should be tailored to the league you choose. You are free to select any sport and league you prefer. The choice of league will not impact your grade, but it must be a current, real-world league that is internationally recognized. Your app should display real-time data for the selected league, as described below.

User stories are categorized by user types:

As a visitor: Features available to all website visitors, whether logged in or not.
As a user: Features accessible only to authenticated users.
As an admin: Features reserved for administrators, such as managing forums, moderating content, and reviewing flagged comments.
Important note: Some of the features described below are not applicable in this part of the project. However, it is essential to understand the full scope of the application to design it effectively.

Accounts
As a user, I want to sign up using my email and password or through a major third-party authentication provider like Google or GitHub.
As a user, I want to log in and log out seamlessly.
As a user, I want to edit my profile, including my username, avatar (or profile picture), and favorite team from the league. Authentication should be implemented using a proper JWT setup.
Matches
As a visitor, I want to view information about upcoming and recent matches in the league. Each match should display details such as teams, logos, date and time, venue, and scores (if completed).
As a visitor, I want to see the league standings/tables with all relevant details.
As a visitor, I want to browse the different matchdays or stages of the competition.
As a visitor, I want to view match information for a specific matchday or stage of the competition.
Forums and Discussions
As a visitor, I want to access auto-created, dedicated discussion threads for each match, where users can post comments. Threads should open no more than two weeks before the match and close two weeks after the match ends.
As a visitor, I want to browse discussion threads, which could be general (league-related) or specific to a team (including match-related threads). I want to be able to see the thread posts and replies.
As a visitor, I want to search threads based on title, author, team, and tags.
As a user, I want to create new discussion threads in any team's forum or the general forum. Threads should include a title, main post, and a list of tags. New tags can be created if they do not already exist.
As a user, I want to post replies to existing discussion threads.
As a user, I want to create polls within a discussion thread to ask questions and gather opinions from other users (e.g., "Who will be the man of the match?"). A poll must have a known deadline, after which voting is disabled.
As a user, I want to list, edit, and delete my own posts, replies, threads, and polls. If I edit a post or comment, earlier versions should be retained and accessible to other users.
As a user, I want to vote in polls and see the results.
Moderation
As a user, I want to report posts or threads that I find inappropriate, providing a reason for the report.
As an admin, I want the system to automatically flag potentially inappropriate comments for review, helping maintain a positive and respectful community.
As an admin, I want to view a queue of reported items for review, sorted by AI-generated verdicts and the number of user reports.
As an admin, I want to see an AI-generated verdict when reviewing a reported item, indicating whether the post is inappropriate. The verdict should include an explanation, such as a textual reason, toxicity score, or other relevant details, to assist in decision-making.
As an admin, I want to dismiss a report or approve it and hide the original content. This will make the original post, comment, or thread invisible to other users, and no further activity (reply, vote, edit) is allowed on that content by any user.
As an admin, I want to ban/unban users based on the submitted reports, preventing them from creating threads, participating in discussions, following new users, or voting in polls.
As a user, I want to submit an appeal request to unban myself. If this request is approved, the restrictions are lifted.
AI-powered Enhancements
As a user, I want to see an overall sentiment indicator on match threads, showing the collective mood (e.g., positive, negative, mixed) based on AI analysis of all comments. Sentiment should also be calculated for both teams in a match, based on comments posted by their fans.
As a user browsing, I want an option to translate a post or comment written in a different language into English.
As a user, I want to read a daily digest post generated by AI that summarizes the top discussions, recorded matches, and standings, allowing me to quickly catch up on recent events.
Social and Community
As a visitor, I want to check out a user's profile page, which includes the number of followings, followers, associated team, and a list of threads, posts, and replies.
As a visitor, I want to see the activity chart of a user over a certain period of time. Activity is determined based on the number of posts and comments authored by the user.
As a user, I want to follow/unfollow other users to keep up with their activity.
As a user, I want a personalized activity feed on my dashboard that shows recent posts and comments to my posts, or from the users I follow, as well as recent updates for my favorite team, including new match scores and new threads in the team's forum.
As a user, I want my feed to group the data in a meaningful way so I do not get overwhelmed by a large number of events on a specific post/comment.
As a user, I want to view a list of users I am following and a list of users who are following me. I also want to remove a follower that I do not like. The lists should be sorted by the time the follow action occurred.
User Experience
As a visitor, I want a clean and intuitive user interface that allows me to navigate the platform effortlessly. This web app should give off a sporting vibe with modern UI design, not an old-fashioned forum or a basic website with a bunch of lists, tables, and forums. It must include photos and videos related to the league with an intriguing design.
As a visitor, I want the website to render well on different screen sizes (e.g., monitors, laptops, tablets, and mobile devices).
As a visitor, I want the option to toggle between dark and light modes.
Part 1 deliverables
In this part, you will develop the Next.js backend for the project. You should design database models and implement API endpoints that fulfill the above user stories. All APIs must be RESTful. You should also determine what user stories are relevant to the backend and only implement those.

This part's grading is completely separate and independent of the next part. You will get to modify your backend code for the next part. Your marks for Part 1 will not be updated based on your submission in Part 2.

Note 1: As potentially ambiguous as the handout gets, do not hesitate to ask your questions on Piazza and/or discuss them with TAs at mentor sessions.

Note 2: When initializing the Next.js project (using npx create-next-app), it is recommended to choose yes for the questions about the use of App router, Typescript and TailwindCSS. This will make sure that you will not need to manually re-configure the project at part 2. Ignore the .ts and config files and simply write your code in .js files. It will still work as expected.

Note 3: You need to implement the project using REST, Next.js, Prisma, React (next part), TailwindCSS (next part), and Docker (next part). Using alternative frameworks (such as GraphQL, Angular, Django, Sequelize, etc.) is not allowed.

Note 4: Even though submitting the .env file is discouraged in general, we ask you to push it to your repository to simplify setup for the TAs at the interviews.

What to submit
Push your entire Next.js project, as well as the following files (place them in the root folder of your repository):

A script named startup.sh: runs all preparations needed for your code to run in a new environment, including installing all required packages via npm, running all migrations, etc. Your startup script can also fetch the list of teams and the league's structure from the external sports API and save them into your database.
A script named run.sh: starts your backend server.
A Postman collection (named postman_collection.json): a comprehensive and organized export of your APIs which is importable into Postman. The TAs will interact with your backend server via Postman. Be sure to include example POST data, query parameters, and headers for every request. Ensure the collection is self-explanatory and easy to navigate.
Your collection should automatically set and use the tokens without the TAs having to manually paste them at every request.
The actual values of query parameters and POST data is not important; the TAs will change them at their discretion to test different scenarios.
OpenAPI-formatted docs (named collection.openapi or openapi.yaml): provides a nice visualization of all your APIs. The file should be importable to Swagger (https://editor.swagger.io/). It contains a full list of all API endpoints, where each endpoint includes a short description, allowed methods, payloads, and an example request and response. Note that several tools exist to convert Postman collections to OpenAPI and vice versa.
A short document named docs.pdf: includes your model design with a brief explanation of database models, their fields, and their relationships. Including an ER or class diagram helps with the illustration.
Important note: Before submitting, ensure that your startup and run scripts function correctly in the described environment, and your collection can be imported into Postman without any issues. The TAs will test your application on clean instances of that environment. If you have developed on a different operating system, it is your responsibility to double-check that your server works on our environment as well.
