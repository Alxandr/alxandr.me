---
type:   post
title:  "Crazy things you can do with the F# ternary operator"
date:   "2016-08-31T22:00:00.000Z"
tags:   F#
author: Alxandr
issue:  7
---
I was working with two different monads in F# the other way, and writing code like the following:

```fsharp
// Async.bind is a simple function calling async.Bind and
// Async.unit calls async.Return.
let myAsync = Async.bind (fun i -> Async.unit (i + 2)) (Async.unit 1)
let myOption = Option.bind (fun i -> Option.unit (i + 2)) (Option.unit 1)
```

I did not want to use a builder for different reasons, therefore I was calling `bind` manually. However, while the code
above works I was not happy with it and wanted to improve it. The obvious thing to do first is to swap the arguments using
the pipe (`|>`) operator, in which case we end up with this:

```fsharp
let myAsync =
  Async.unit 1
  |> Async.bind (fun i -> Async.unit (i + 2))

let myOption =
  Option.unit 1
  |> Option.bind (fun i -> Option.unit (i + 2))
```

The result is definitely better, but I'm still not digging it. One of the things I don't like about this is the fact that I
have to surround my lamdas in parenthesises. Which for this trivial example doesn't really much matter, but if we were to
extend it, calling bind multiple times inside of eachother (which is quite common), you end up with deeply nested code and a
lot of parenthesizes. Now one of these things I can do something about. The solution to remove the parenthesizes is the bind
operator `>>=`. With it I could do things like this:

```fsharp
let myAsync =
  let (>>=) ma f = Async.bind f ma
  Async.unit 1 >>= fun i -> Async.unit (i + 2)

let myOption =
  let (>>=) ma f = Option.bind f ma
  Option.unit 1 >>= fun i -> Option.unit (i + 2)
```

This is a lot better than what we started with, if you ask me, but I have to define the `>>=` operator in each place I need to
use it. This is unfortunate, but because there is no common abstraction between `Option.bind` and `Async.bind` (F# doesn't have type classes),
 I can't create a single `>>=` operator that works for both types. Or can I?

## Operator dreamland
Before I go any further, I'd like to take a small moment to discuss what my end goal here is, or rather what I hope to achieve. I've yet
 managed to tick every box of this checklist, but I'm hopeful there is a way to do so. Although a bit doubtfull. So for now I want to create
  2 operators, `>>=` and `>=>`, fulfilling the following criteria:

1. The operators should work on built in types (of which I have no control), such as `Async` and `Option`.
2. The operators should work on my own types by adding a little bit of code to them.
3. The operators should work on external types which I do not control, such as `WebPart` from `Suave`.
4. The operator `>=>` should be defined in terms of `>>=`, **if** it is not specifically defined for the type in question.

Of the 4 points above, I've only managed to fulfill 2 of them. If anyone have any good ideas of how to resolve the second two, please let me know :). Anyways, on to some code.

## Inline methods and ternary operators
F# has a little know ternary operator (`?<-`). As is given from the name "ternary operator", it takes 3 arguments (as opposed
to binary operators which takes 2, or unary which takes 1). This is very usefull, because it means we can use 1 of those 3
arguments to play games with the method overloading system that exists in F# (and .NET in general). This can be used to create
code that quite nicely supports our two first requirements as such:

```fsharp
[<AutoOpen>]
module Operators

module Ops =
  type Bind = Bind with
    static member (?<-) (_: Bind, ma: Async<'a>, f: 'a -> Async<'b>) = Async.bind f ma
    static member (?<-) (_: Bind, ma: Option<'a>, f: 'a -> Option<'a>) = Option.bind f ma

let inline (>>=) ma f =
  (?<-) Ops.Bind ma f
```

This is actually all you need to get the (`>>=`) working for both `Async` and `Option` in F#. Let me explain a bit more about how
it's working. The trick lies in the line `(?<-) Ops.Bind ma f`. What this does is look at the types of `Ops.Bind` (which is `Ops.Bind`),
`ma` (which can be anything, but is in this case either `Async<_>` or `Option<_>`), and `f` which is a function. It then checks to see if
any of the three types has the operator `?<-` defined, such that the first argument can be of type `Ops.Bind`, the second argument can
be of the type of `ma`, and the third argument can be of the type of `f`. If no such operator is found, the compiler will complain. The
really cool thing about this though, is that both `Ops.Bind` and `ma` is considered when looking for implementations of the `?<-` operator.
This means that if I create my own monadic type later down the line (like an `Identity` type), I can support the bind operator as easily as this:

```fsharp
type Identity<'t> = Ident of 't with
  static member (?<-) (_: Ops.Bind, ma: Identity<'a>, f: 'a -> Identity<'b>) =
  	let (Ident a) = ma
    f a
```

That's all you need. Now, I can suddenly do the following:

```fsharp
Ident 5 >>= fun a -> Ident (a + 2)
```

But hold on a minute. Couldn't I just create `>>=` operator on the types you wanted to use `>>=` with? Well, no. If I wanted `>>=`
to only work with those types, then sure. But there is no way for me to add operators to built in types like `List` and `Async`.
Therefore I have to pull tricks like these. So with this we've fulfilled two of the 4 requirements I set for myself. Not really a
whole lot, but it still buys me quite a bit when using it within a single project. The problem is that the project that defines the
operators, needs to have all of the dependencies of all the other projects, because there is no way (that I've found) to define the
`>>=` operator in project A, and then define `>>=` for an external type like Suave's `WebPart` in project B. If anyone has any solutions
to this I'd love to hear about it. The other problem is that while I can easily define `>=>` in terms of `>>=` now, I don't know how to
allow types to override the behavior of the `>=>` operator. But still, I think it's a nice technique to know about and abuse, cause it
allows for some pretty nice code without having to resolve to reflection. If you have suggestion to improvemenets, please leave a comment
bellow.
