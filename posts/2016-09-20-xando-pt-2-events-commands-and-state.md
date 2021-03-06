---
title: 'Xando pt. 2 - Events, Commands and State'
date: '2016-09-20'
series: xando
tags: ['Xando', 'CQRS', 'Event Sourcing', 'F#']
issue: 9
---

In the previous post we talked about some general concepts of CQRS and Event Sourcing. In this one I'd like to get a bit more hands on with the problem. Namely, I'm going to look at what events and commands we need for our user system, and what state we should keep to enable writing our business logic. So, let's start by analysing what a user can do. Or more more to the point, what a user can have done (which is a really weird sentence). Let's talk about events.

# Events

In general, when dealing with database systems, most programmers knows that there are only 4 things you can do. Create, Read, Update and Delete (or CRUD) for short. However, since we're dealing with events here we can drop the read part, which means we are left with create, update and delete. As far as I know, _any_ system, event sourced or not, can make due with just those 3 events. If you don't believe me, go take a look at your database transaction logs. There you have those three events. So you _can_ create a event sourced systems with these three events, however I would argue that it's not a good idea. It's probably even a bad idea. When you look to a stream of events and see the three events "Create", "Update" and "Delete", there are several problems. First of all, they don't read like events. They read like commands. A good way to test this, is to attempt to make an english sentence out of the events, for instance "Yesterday I Create a User". As you can see, that does not work out. Events should always be in past tense. So even if we wanted to use the three events above we should at least rename them to "Created", "Updated" and "Deleted".

Secondly, the events doesn't really tell us much. If you just skim through a bunch of events and see "Created", you're left wondering "created what?". You have to drill down into the data to see what actually happened, even though a lot more information could easily be available at a glance. This is especially true for "updated" kind of events. Let's take the example of a blog post again. A blog post can also be created, updated and deleted, however we can create much more specific events that makes the system more understandable, both from just reading the event stream and looking at the code. With a blog post you could for instance have the following events:

post-created
: A new blog post was created.

post-published
: A post was published.

post-renamed
: A post was renamed.

post-content-changed
: A post's content was changed.

post-unpublished
: A post was unpublished.

post-deleted
: A post was deleted.

Most of the events here could easily be grouped together as just "updated". However, by creating more specific events we're left with an event stream that's easier to get at-a-glance information from, and code that reads cleaner (at least in my opinion).

Now, let's go back to looking at user events. What can be done to a user entity? I've found 4 events that makes sense to me, and they are:

user-registered
: A new user had registered - this is the create event. This event needs all the data a valid user entity needs. Just like in normal SQL, when you do the initial `INSERT`, you need to have the data for all required columns available.

user-renamed
: A user has change their display name. This event only needs the new user name.

password-changed
: A user has changed their password. This event only needs the new password hash.

user-deleted
: A user has deleted their account. This event doesn't need any data.

There might be others that I have not considered yet. There might also be others that I've chosen to ignore for now and add later, when stuff is properly working. "User Validated" is a good example. Eventually I am planning to have user validation of some form, but currently that's outside of my scope. Another thing I like to do is add a "reason" string to all of my events. In most cases this can be left empty, or set to some default string like "a user was registered" for the `user-registered` event, but in some cases where the system is in a bad state, and something has to be fixed either manually or automatically I think it can be a good idea to be able to supply a reason to an event. Such as "user was deleted because another user with the same email existed" - a problem that can occur with eventual consistency. With that in mind, we can now go ahead and write some actual code. The events above, with the additional reason parameter can look as following in F#:

```fsharp
[<EventType(categoryName)>]
type Event =
| Registered of mail: Email * username: string * password: Password * reason: string
| PasswordChanged of password: Password * reason: string
| EmailChanged of mail: Email * reason: string
| Deleted of reason: string
```

Pretty straight forward, right? You can ignore the `EventType` attribute for now, it's only there to deal with serializing and deserializing to JSON. I will explain how that works in a later blog post. The `Password` and `Email` types as well will be explained in a later blog post. One thing to note about the code above is that I've named all of the properties of the different events. This is not required, nor enforced by F#, however **I would really recommend you do so**. Not only do I use these names in generating JSON representation of the events, but it also makes the code a lot more understandable than simply `| Registered of string * string * string * string`.

# Commands

Now that we've looked at the events in the system, let's take a look at the commands. The commands for the user system is almost identical to the events. There are some minor changes (like the fact that I don't have `reason` in the commands). However, the most significant ones is that commands are not in past tense, and that most commands contain a target user, whereas events do not. This is based on how I'm using [EventStore][eventstore] to store my events. In EventStore, all events belong to some "stream", and you can have as many of these "streams" as you want. This fits nicely in the way we've divided up our aggregates, in that each aggregate can have a stream of their own. In other words, each user in our system will have a event stream of their own. This means that events inside that stream do not need to carry any user id, because because they are bound to a user by which stream they are inserted into. This means if I have the streams `user-bob`, I don't need to tag events inside the streams with `user-id: bob` because the fact that I found the event inside the `user-bob` stream means that it belongs to `bob`. Also notice that I'm using `user-<id>` as a convention for the stream names. This is called "categories" in EventStore, and is how I'm later able to do things like get all events from all users, but that's for a later post.

The commands however, are not found in streams, so they need to contain a user id (for any command that targets a already existing user). Another difference is that I treat commands a entry into my system, so I don't expect issuers of my commands to know about internal representations like `Email` and `Password`. Instead, a command closely resembles what you would send in a `POST` request to an API using JSON, meaning it can only deal with simple types like `string`, and types that our JSON converter knows how deserialize. I then do validation on the commands which in turn either produces events, or errors. All that being said, here are the commands for our user system:

```fsharp
[<CommandType(categoryName)>]
type Command =
| Register of mail: string * password: string * username: string
| ChangePassword of id: Guid * password: string
| ChangeEmail of id: Guid * mail: string
| Delete of id: Guid
```

# State

Now that we know the commands we want to execute against our system it's time we start looking at state. But before we do that, I'd like to add a few words about what the state should be used for. And that is testing our business logic. This is very different from how I normally do things with libraries such as Entity Framework or any sort of service I've written before, because the code we're currently working on _only cares about writing events_. There is no reading of data at all. Therefore, the only state needed is state we need to uphold our business logic. And thus, to figure out what state we need, we need to first figure out what our business rules are. And in our case there aren't that many. Also, a thing to remember is that we can only uphold these invariants _within_ our aggregate. So there is no way for us to test that we don't already have a user with that email registered. To do so would be crossing aggregate boundaries. Remember, a single user is an aggregate. Now, that isn't to say we can have no such tests at all, but we can't do so yet. And this is also not the place to do so. So we're left with business rules that only deal with a single user. This leaves us with not so many business rules to consider. The ones I've found are the following:

1. A user cannot be created twice. This means that the `Registered` event should never occur twice in a single event stream. However, this is a more general rule so I'll be handling that in a more general place later.
2. A user cannot change his email address to the same address he already has.
3. A user cannot issue new commands after it has been deleted. This is also a general rule, so it will be handled outside the `user` code.

This means that the only state we really need to validate our business rule (which is down to one) is the mail of a user. Thus our state type:

```fsharp
type State = private {
  mail: Email
}
```

# In conclusion

While I had more planed for this post, it's run long enough already. Again, I'd love feedback. If you have something to add, or found something I've done wrong, please leave a comment below.

[eventstore]: https://geteventstore.com
