---
title: On the annoyance of (parsing) strings
tags:
  - rust
  - jsonnet
  - parsing
series: rust-jsonnet
date: 2020-06-06T18:13:17.951Z
---
[Last week][pt-1] I went through the setup of the lexer for Jsonnet. As part of that post, I expressed the opinion that

> strings are annoying
>
> — Aleksander Heintz, 2020

I figured I should expand on that a bit this week. But first, some context for those of you who didn't read the previous post (or have simply forgotten).

# Parsing vs lexing strings

The fist thing I would like to point out is that depending on the language you're trying to implement, there is a large difference between parsing and lexing strings. For instance, the language I'm currently working on, [Jsonnet][jsonnet], has 3[^1] different kind of strings, namely:

* Normal strings (`"foobar"`),

* Verbatim strings (`@"foobar"`) and

* Block strings[^2]:

  ```jsonnet
  |||
    foobar
  |||
  ```

The first two can be easily tokenised in a lexer using some rather crazy regexes[^3], the last one I'm not convinced can be processed using regex at all (though feel free to prove me wrong). However, neither one of them can be *parsed*[^4] using regexes. 

[^1]: 5 if you're counting different quote types as different string types.
[^2]: This string is not the same as the two previous, because it contains a newline.
[^3]: If you're interested, check [my previous post][pt-1].
[^4]: Caveat that if you have a string with no escaped characters, regexes can tell you that is indeed the cases and you can conclude that you don't need to do any parsing. So in that sense, you can parse them with regex, but only the trivial case.

[pt-1]: https://alxandr.me/2020/05/31/rust-jsonnet-lexer	"Rust Jsonnet: Lexer"
[jsonnet]: https://jsonnet.org/ "The Jsonnet language"