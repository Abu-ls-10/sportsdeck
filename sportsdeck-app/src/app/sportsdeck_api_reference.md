# SportsDeck API Reference

## Social and Community

  Method   Endpoint                               Description
  -------- -------------------------------------- ------------------------------
  GET      /api/users/:id                         Get user profile
  GET      /api/users/:id/followers               List a user's followers
  GET      /api/users/:id/following               List users a user follows
  DELETE   /api/users/:id/followers/:followerId   Remove a follower
  POST     /api/follow/:userId                    Follow a user
  DELETE   /api/follow/:userId                    Unfollow a user
  GET      /api/users/:id/activity                Get user activity chart data
  GET      /api/feed                              Get personalized user feed
  PATCH    /api/feed/:id/read                     Mark feed item as read

------------------------------------------------------------------------

## Forums and Discussions

  Method   Endpoint                       Description
  -------- ------------------------------ --------------------------
  POST     /api/threads                   Create discussion thread
  GET      /api/threads                   Browse/search threads
  GET      /api/threads/:id               Get thread details
  PATCH    /api/threads/:id               Edit thread
  DELETE   /api/threads/:id               Soft-delete thread
  POST     /api/threads/:threadId/posts   Create post in thread
  GET      /api/threads/:threadId/posts   Get thread posts
  PATCH    /api/posts/:id                 Edit post
  DELETE   /api/posts/:id                 Delete post
  GET      /api/posts/:id/versions        Get post edit history
  POST     /api/posts/:postId/replies     Reply to a post
  GET      /api/posts/:postId/replies     Get replies
  PATCH    /api/replies/:id               Edit reply
  DELETE   /api/replies/:id               Delete reply
  GET      /api/replies/:id/versions      Get reply edit history
  POST     /api/threads/:id/poll          Create poll for thread
  POST     /api/polls/:id/options         Add poll option
  POST     /api/polls/:id/vote            Vote in poll
  GET      /api/polls/:id                 Get poll details
  GET      /api/polls/:id/results         Get poll results
  PATCH    /api/polls/:id                 Edit poll
  DELETE   /api/polls/:id                 Delete poll
