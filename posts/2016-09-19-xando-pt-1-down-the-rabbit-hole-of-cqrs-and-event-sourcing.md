---
title: 'Xando pt. 1 - Down the rabbit hole of CQRS and Event Sourcing'
date: '2016-09-19'
series: xando
tags: ['Xando', 'CQRS', 'Event Sourcing']
issue: 8
---

A friend of mine and I have recently started working on a project that involves CQRS and Event Sourcing, both of which are new to me. Therefore I figured I'd try to start a blog series explaining the issues I've faced (and will be facing), how I got around them, as well as show how I'm structuring and developing this project. But before I get started with that, I'd like to start by explaining what **I** mean when I say CQRS and Event Sourcing, as well as some other terms that I will be using later in this series (if I ever get that far). Do note however, that I am in no way an expert on these subjects. This project is the first ever project in which I attempt to do both CQRS and Event Sourcing, so I can't guarantee that what I write in this post is entirely correct. If you do however find some errors, please do notify me in the comments bellow. Anyways, on to the first topic on the agenda:

# Event Sourcing

Event sourcing is a fairly simple concept in principle. It's basically just describing a system, where instead of storing the system state, you store a set of events that lead you to that state. This is in no way a new concept, and there are several systems that use this already, some of which you've probably used. The one which I interact with the most is probably [git][git]. In git, instead of storing a snapshot of how the repository looks, you store all the diffs that lead to you being where you now are. This way, if you ever introduce a bug somewhere, you can always get back to where you were. Obviously, there are other ways of achieving this too, like storing all of the snapshots instead of diffs, but that would end up talking a lot more space than just storing the diffs. Another key aspect of the event sourcing I'll be using in Xando is the fact that it's immutable and append only. For database I've chosen to go with [Event Store][eventstore].

# CQRS

CQRS stands for Command Query Responsibility Segregation (which is really fancy sounding, and made me do a complete 180 when I first read it) and basically just means that you want to separate your reads (the query part) from your writes (the command part). As an example of a CQRS system I'm going to use my current blog, on which you are probably currently reading this post. The blog I'm using is built using [jekyll][jekyll] and uses [git][git] to "store" the posts/updates. Whenever I push an update to GitHub (which is a command), a continuous integration job is started which fetches the last commit from my blog repository, builds it, and uploads the built sources to GitHub Pages. These, built pages are the "view model" of my system, which you "run queries" against. Now, this is a bit of a weird way of looking at it, but when you go to `alxandr.me/foo.html` this can easily be considered querying `alxandr.me` for `/foo.html`. In the same manner, when you're looking at this blog post, you're querying GitHub pages for this blog post. Or rather, you're querying GitHub pages for the HTML version of this blog post, as opposed to the markdown content that's stored in [git][git]. The thing to realise here is that my writes and reads (commands and queries) are working against two entirely different systems. I write markdown, and my "commands" are git pushes. But when I read, I ask for html files from a web server, which does not understand anything about markdown or git. This is, to me at least, the point of CQRS.

One of the nice things this buys me is the ability to scale the two differently. In the case of my blog for instance, there is a high likelihood that I will be receiving a _lot_ more read requests (queries) than I commit updates (commands). However, thanks to my architecture, I can scale up the read side completely independently on the write side. The read side of my blog is just a bunch of static HTML files with no logic attached to them. I could easily put this on a CDN and geo-distribute it, while just keeping 1 git server around. The same is true for systems where you have a lot more writes than reads. It allows you to scale things independently from each other, and achieve near linear scaling in some cases.

# Domain Driven Design (DDD)

If you go searching the internet for event sourcing and CQRS, you are almost bound to end up reading about domain driven design somewhere along the line. These concepts seems to go hand in hand, and Domain Driven Design seems to be the language people speak to describe their system built up of events and aggregates. Now, before I go further, I would like to make the claim that I do not know anything about domain driven design. I've never read a book on it, and the information I've found on the internet has been way beyond me or just hard to access. This to the point where I've tried to avoid it to a certain extent, because I just find it confusing. All of my understanding of the terms which I am lead to believe originate with domain driven design stems from working on the Xando system, and looking at code other people have written, as well as some talks about CQRS and event sourcing. Therefore, as I've said before in this blog post, what I write here might be wrong, so do not simply take my word for it.

# A short description of the system I'm building

Before I go further, describing the issues I've had and what I did to solve them (and eventually, hopefully maybe even reaching up to the current issues I'm facing), I need to provide a short description of the system I'm designing and building. Now, the end-goal is a system with several features, however for starter I decided to only focus on users. So the entirety of my system is effectively a user database, where users can register and sign in, change their passwords, and delete their accounts. Also, the "sign in" part is outside the scope of the initial problem; just the ability to validate that a username & password is correct is all that I aim to initially solve. A user has 4 properties:

id
: the unique identifier identifying the user.

email
: the email of the user.

username
: a user selected username.

password
: a hash of the user selected password.

I will go more into the commands and events of a user later, but first we have to deal with one of the first issues I encountered when starting up this project.

# What on earth is an Aggregate?

> a whole formed by combining several separate elements.
> -- Google

So according to google, an aggregate is what you get when you take a sequence of things, and then aggregate (yes the verb is the same word) them together into a new thing. That new thing is then our aggregate. In our case, when dealing with event sourcing, the sequence of things we aggregate is the event stream, and the thing we produce by aggregating the events is the system state. So, the simple, and first answer I reached was that the state of the system was my aggregate. In my case this was a list of users. However, after sifting through a few more videos and blog posts I reached the conclusion that my previous assumption was likely wrong. Instead, as of writing this post, I think of aggregates as entities, or more to the point as documents that you would typically store in a document database like [MongoDB][mongodb]. Whether or not this is wrong, I'm not sure, but at least it seems to work.

There is also the notion of Aggregate Root, which I've seen in talks by Greg Young. However, I have no idea what an Aggregate Root is, or how it differs from a regular Aggregate. Nor what a regular Aggregate is (one that isn't an Aggregate Root).

# Closing words

I didn't really get to show any code, nor discuss events or commands in this post, because I think it's run long enough already. Next time we'll look at some actual code. If you find any errors in the above (which there is likely to be), please leave me a comment.

[git]: https://git-scm.com/
[eventstore]: https://geteventstore.com/
[jekyll]: https://jekyllrb.com/
[mongodb]: https://www.mongodb.com/
