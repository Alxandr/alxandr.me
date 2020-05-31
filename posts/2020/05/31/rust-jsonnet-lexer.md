---
title: 'Rust Jsonnet: Lexer'
tags: ['rust', 'jsonnet', 'lexing', 'parsing']
series: rust-jsonnet
issue: 43
date: '2020-05-31'
---

For a while now, I've been working on a rust implementation of an interpreter (and maybe if I get to it, a jitter) of the [jsonnet] language. I've written serveral parsers (and lexers), and used several different iterations of both AST and the core language, though I've never gotten as far as to actually implement the interpretation part. However, at this point in time, I'm reasonably happy with how the parser works for once, and I'm also somewhat confident that it works reasonably well. After all, it managed to parse the jsonnet [stdlib] (which is written in jsonnet). Given how much work I've put into this interpreter, and how dead my blog has been for a few years, I figured I'd make a post and write about my experiences. Regardless, having fixed my blog (it sort of vannished for a year 😅) it's about time I use it.

# Architecture

The architecture of the jsonnet interpreter is one of the things I've written the most of, and scrapped the most of. In the beginning, I started with a single crate, with a hard to follow recursive decent parser that produced AST directly. It bailed on any and all errors, and was quite hard to figure out. This was based on me trying to more or less directly port the [go implementation] of jsonnet. I quickly realized that was not the way to go, given that I was having trouble understanding it myself, and I just wrote it after all. So I set out to switch out the parser with one based on rust traits instead of using giant functions. So I went and stole a bunch of code from [syn] to do parsing, and that actually worked out quite nice. This allowed for writing some really neat parse implementations like the following:

```rust
impl Parse for ArgNamed {
  fn parse(input: ParseStream) -> Result<Self> {
    Ok(ArgNamed {
      name: input.parse()?,
      assign_token: input.parse()?,
      value: input.parse()?,
    })
  }
}
```

It was easy to read, it was easy to write, and it was easy to follow. But it still had some issues, and it was fairly incompatible with one of the goals I had with this project, which was supporting more than 1 error output. A parser that just dies on the first error is mostly fine for a command line utility, but if you want to plug it into an editor of some kind, it's pretty bad. And I'd argue it's mostly bad for command line as well as it produces a check -> fix -> verify loop that's too long. It's not like this couldn't be fixed. The `Result::Err` variant here contains a list of errors after all, but it's the convenience of the `?`-operator that makes it impractical ironically enough. So I rewrote it, again. However, before writing the parser for the third time, I decided I was going to do some actual research before just blindly writing code this time. And this lead me to the [Rust Analyzer].

# A peek into the mind of matklad

As it turns out, if one starts to read about parsers, syntax trees, and the likes in rust, one pretty quickly comes over either code or posts written by [matklad]. After all, one of the posts that got this whole project started is his [post on pratt parsing in rust][pratt parsing]. And that's just one of the posts. I've drawn inspiration from at least the following (and these are just the ones I can remember after the fact):

- [pratt parsing]
- [rust interner]
- [parse_tree]
- [fall]
- [rowan]
- [Rust Analyzer]

Now, I fully acknowledge that he might not have done all of this by himself, but still, I'm pretty sure there's noone (except me) else who've had a bigger impact on how this project ended up being structured. A lot of the ideas for how to split up and implement the different parts of the jsonnet interpreter (or for now, parser) is taken pretty much directly from [Rust Analyzer] itself.

# Concrete syntax trees (parse trees)

A big change on how I did the parsing was moving from creating abstract syntax trees directly from the parser, to instead producing concrete syntax trees (or parse trees). Apologies if the terminology is incorrect here, as I'm definitely not an expert on the subject, but the idea is that instead of taking an expression like `a + b`, and producing something like `Add(Ident(a), Ident(b))`, we instead produce a tree that contains all of the original source, including whitespace, comments and errors. Another big difference is that instead of producing either a tree, or one or more errors, we always produce a tree, regardless of how bad the input is. We then also produce diagnostics[^1] (errors or warnings for instance) and attach them to certain spans in the tree (allowing for an editor to show squigelies for instance[^2]). How this is implemented, however, will be explained in a later post in this series.

# Lexer

A lexer (also known as a tokenizer) is the code responsible for taking the source input and producing a stream of lexemes (or tokens). I've personally always had a love-hate relationship to lexers, and lately I've generally been using lex-less parser combinators instead of lexers. The reason for this is quite simple. The reason to love lexers is that they make parsers much easier. If you just have a stream of tokens (without having to care about whitespace, comments, and other things that doesn't have an effect on the output of the parser[^3]), it's much easier to write a parser. However, the reason I hate lexers is that they typically have to be incredibly context free. At least for me, I've always had a problem with writing lexers, because they allways end up being ambiguous, which you can't do in lexers. Luckily for me though, the [Jsonnet spec] explains exactly[^4] how to do lexing for the Jsonnet language.

The next issue is figurihng out how I want to do lexing. There's a few different options available here, not just in how I want to produce the lexer, but also in what kind of output I want the lexer to produce. To explain, take a look at the following two different `Token` structs:

```rust
// approach 1
enum Token {
  KwTrue(Span),
  KwFalse(Span),
  OpAnd(Span),
  OpOr(Span),
  Ident(Span, String),
}

// approach 2
#[derive(Clone, Copy)]
enum TokenKind {
  KwTrue,
  KwFalse,
  OpAnd,
  OpOr,
  Ident,
}

struct Token<'a> {
  kind: TokenKind,
  span: Span,
  text: &'a str,
}
```

While neither one of these approaches are actually what I eneded up using (I stole the design I ended up going with from [Rust Analyzer]) these two approaches still illustrates the main difference. One of these puts more logic upfront in the parser, but allows the parser to do fancy things like unescaping strings (hence `String`, and not `&str` in the `Ident`[^5] case). One of the downsides is that tokens are typically a bit fatter, after all, they have to potentially carry a `String`. In the example above, definint `Span` as `(u32, u32)`, `Token` in the first approach is 40 bytes alligned, compared to 32 bytes alligned for the second approach. However, considering we're producing tokens for _every_ part of the source file, there's one more optimization we can do (which also moves some of the work to later in the processing pipeline): We can get rid of the `text`, and `span`, instead only giving out a length of the parsed token. The caller that started the lexing should have the string it used to do so, and it can sum together the lengths the lexer emits to get the start and end of any given token. As such, the final `Token` structure looks like this:

```rust
enum TokenKind {
  // we'll get back to this later
}

/// A token of jsonnet source.
#[derive(Debug, Clone, Copy, PartialEq, Eq, Hash)]
struct Token {
  /// The kind of token.
  pub kind: TokenKind,

  /// The token value.
  pub len: u32,
}
```

The size of this structure is only 8 bytes alligned (one 64bit word), and if I really wanted to I could reduce the length to `u16`. I'm still a bit up in the air about that.

## Logos

To do the actual lexing, I've decided to use the [logos] library. Logos enables pretty easy creation of lexers that fit the bill of only producing token types, though it can also easily be used to create lexers that produce tokens that contain their value (whether owned or borrowed). Logos works by using a derive proc macro on an enum of token types, and then decorating the different enum variants with either a `regex` or a `token` attribute. This makes for quite easy tokenizer creation (with some caviats), and it's also quite helpfull in telling you when you did something wrong (like haveing multiple regexes that can accept the same input). Variants decorated with `token` have higher precedence than those decorated with `regex`, so to deal with keywords that would be valid identifiers, one can simply decorate them using `token` (or one could just as easily disambiguate them after the fact, but given that this is builtin to logos, I choose to do it that way).

Logos also requires an error variant (it can be called whatever you like) decorated with `error`, which is what it will produce if it finds a token it does not have a matching arm for. So the starting point for our lexer (using logos) looks like this:

```rust
use logos::Logos;

#[derive(Logos, Debug, PartialEq)]
enum RawToken {
  #[error]
  Error,
}
```

As for why it's called `RawToken` and not `TokenKind`, there's a few reasons for that. One of them is that this enum is not public, so the underlying tokenizer implementation is kept private, not giving anyone access to the logos generated lexer directly. This is usefull, because the lexer I've created wraps the logos lexer and does some extra book-keeping (amongst other things). There is a separate enum called `TokenKind` which is public, and I map from `RawToken` to that one. The following sections are going to prepend variants to the `RawToken` enum keeping the `Error` variant at the bottom.

### Keywords

First off is keywords. They are pretty straight forward, and nothing really much to them. All of them are defined as `token`s, because there is no wildcards in use. The keywords are defined as such:

```rust
  #[token("assert")]
  KeywordAssert,

  #[token("else")]
  KeywordElse,

  #[token("error")]
  KeywordError,

  #[token("false")]
  KeywordFalse,

  #[token("for")]
  KeywordFor,

  #[token("function")]
  KeywordFunction,

  #[token("if")]
  KeywordIf,

  #[token("import")]
  KeywordImport,

  #[token("importstr")]
  KeywordImportStr,

  #[token("in")]
  KeywordIn,

  #[token("local")]
  KeywordLocal,

  #[token("null")]
  KeywordNull,

  #[token("tailstrict")]
  KeywordTailStrict,

  #[token("then")]
  KeywordThen,

  #[token("self")]
  KeywordSelf,

  #[token("super")]
  KeywordSuper,

  #[token("true")]
  KeywordTrue,
```

### Identifiers

Identifiers are also pretty straight forward, the only important point being that all of the keywords would be valid identifiers (if they weren't keywords). But logos takes care of that for us:

```rust
  #[regex(r"[_a-zA-Z][_a-zA-Z0-9]*")]
  Ident,
```

### Numbers

Numbers are much more interesting that identifiers and keywords, and the [Jsonnet spec] does a pretty bad job of defining them, simply pointing to the [JSON spec] which does not have a regex but instead a DST diagram. Considering the identifiers are defined by a regex, I think there should be one listed for numbers as well. However, the lack of a regex is not what makes numbers interesting, that just makes them annoying, rather it's the error handling aspect of numbers. For instance, take the string `1.+` or `1e+!`. While neither one of them is a valid number, they are both clearly attempts at creating numbers. Therefore, not only does our lexer have to handle correct numbers, but also a few error cases, which results in the following 4 new token kinds:

```rust
  #[regex(r"(?:0|[1-9][0-9]*)(?:\.[0-9]+)?(?:[eE][+-]?[0-9]+)?")]
  Number,

  #[regex(r"(?:0|[1-9][0-9]*)\.[^0-9]")]
  ErrorNumJunkAfterDecimalPoint,

  #[regex(r"(?:0|[1-9][0-9]*)(?:\.[0-9]+)?[eE][^+\-0-9]")]
  ErrorNumJunkAfterExponent,

  #[regex(r"(?:0|[1-9][0-9]*)(?:\.[0-9]+)?[eE][+-][^0-9]")]
  ErrorNumJunkAfterExponentSign,
```

### Symbols

Following right allong the spec (skipping strings for now, because they are annoying), after numbers, there are some symbols to parse. Nothing too terribly interesting here, all of them single-character tokens.

```rust
  #[token("{")]
  SymbolLeftBrace,

  #[token("}")]
  SymbolRightBrace,

  #[token("[")]
  SymbolLeftBracket,

  #[token("]")]
  SymbolRightBracket,

  #[token(",")]
  SymbolComma,

  #[token(".")]
  SymbolDot,

  #[token("(")]
  SymbolLeftParen,

  #[token(")")]
  SymbolRightParen,

  #[token(";")]
  SymbolSemi,

  #[token("$")]
  SymbolDollar,
```

### Operators

Operators however, are quite different. In the lexer spec the operators are defined as any combination of the characters `!$:~+-&|^=<>*/%` of any length. However, there's only a few of those combinations that are actually valid operators, so I would like to have one case for each of those, and an error case for the rest. I could have done this the same way as I did for numbers (and maybe should have), but instead how this is currently defined in the `RawToken` enum is as following:

```rust
  #[regex(r"[!\$:~\+\-&\|\^=<>\*/%]+", lex_operator)]
  Op(Operator),
```

The thing to take notice of here is the second argument to the `regex` attribute, namely `lex_operator`. This is a locally defined `fn` that takes the output of that regex and further does logic on it, producing an `Operator`. This function is pretty simple, it's a mapping between known strings and known operator types (defined in it's own `op` module):

```rust
#[derive(Clone, Copy, Debug, PartialEq, Eq)]
pub(super) enum Operator {
  Not,
  Assign,
  Colon,
  DoubleColon,
  TripleColon,
  PlusColon,
  PlusDoubleColon,
  PlusTripleColon,
  Mul,
  Div,
  Mod,
  Plus,
  Minus,
  ShiftLeft,
  ShiftRight,
  LessThan,
  GreaterThan,
  LessThanOrEqual,
  GreaterThanOrEqual,
  Equal,
  NotEqual,
  BitAnd,
  BitXor,
  BitOr,
  BitNeg,
  And,
  Or,
  Unknown,
}

impl Operator {
  fn from_str(s: &str) -> Operator {
    match s {
      "!" => Operator::Not,
      "=" => Operator::Assign,
      ":" => Operator::Colon,
      "::" => Operator::DoubleColon,
      ":::" => Operator::TripleColon,
      "+:" => Operator::PlusColon,
      "+::" => Operator::PlusDoubleColon,
      "+:::" => Operator::PlusTripleColon,
      "*" => Operator::Mul,
      "/" => Operator::Div,
      "%" => Operator::Mod,
      "+" => Operator::Plus,
      "-" => Operator::Minus,
      "<<" => Operator::ShiftLeft,
      ">>" => Operator::ShiftRight,
      "<" => Operator::LessThan,
      ">" => Operator::GreaterThan,
      "<=" => Operator::LessThanOrEqual,
      ">=" => Operator::GreaterThanOrEqual,
      "==" => Operator::Equal,
      "!=" => Operator::NotEqual,
      "&" => Operator::BitAnd,
      "^" => Operator::BitXor,
      "|" => Operator::BitOr,
      "~" => Operator::BitNeg,
      "&&" => Operator::And,
      "||" => Operator::Or,
      _ => Operator::Unknown,
    }
  }
}

pub(super) fn lex_operator<'a>(lex: &mut logos::Lexer<'a, RawToken>) -> Operator {
  Operator::from_str(lex.slice())
}
```

If I feel like it, I might rewrite this to use the same kind of logic keywords and identifiers use, as it's probably be more efficient using logos for this disambiguation directly.

### Strings

Last on our list of valid non-trivia tokens is strings. As explained earlier, strings are annoying. The regexes are hard to write, and I don't think it's even possible to write a valid regex for the block string expression supported by [Jsonnet] (well at least not without some fancy lookaround that's way beyond me). The logos part of strings looks like this:

```rust
  #[regex("\"(?s:[^\"\\\\]|\\\\.)*\"")]
  StringDoubleQuoted,

  #[regex("'(?s:[^'\\\\]|\\\\.)*'")]
  StringSingleQuoted,

  #[regex("@\"(?:[^\"]|\"\")*\"")]
  StringDoubleVerbatim,

  #[regex("@'(?:[^']|'')*'")]
  StringSingleVerbatim,

  #[regex(r"\|\|\|", lex_str_block)]
  StringBlock(StringBlockToken),
```

I'm not going to lie, I had help writing those regexes. And I'm not entirely sure I can even explain _why_ they work, but they appear to do so (this is why we write unit tests, right?). [Jsonnet] has 5 different string represntations:

1. Normal double quoted strings: `"hello\"world"`.

2. Normal single quoted strings: `'hello\'world'`.

3. Verbatim double quoted string: `@"hello""world"`.

4. Verbatim single quoted string: `@'hello''world'`.

5. Block string:

   ```jsonnet
   |||
     hello"world
   |||
   ```

Block strings are weird. First of all, they use `|||` as "quotes". Secondly, they care about indentation. I'm not saying it's not usefull, but I'm definitely saying it's weird. As you can see from the regex above, I only match on the opening `|||`, and then take over the rest of the string lexing using the `lex_str_block` function, which is too long to put in this blog post[^6].

Strings also have a few well known error cases (unterminated strings and verbatime strings missing quotes). So we need to add some lexer variants for those as well:

```rust
  #[regex("\"(?s:[^\"\\\\]|\\\\.)*")]
  ErrorStringDoubleQuotedUnterminated,

  #[regex("'(?s:[^'\\\\]|\\\\.)*")]
  ErrorStringSingleQuotedUnterminated,

  #[regex("@\"(?:[^\"]|\"\")*")]
  ErrorStringDoubleVerbatimUnterminated,

  #[regex("@'(?:[^']|'')*")]
  ErrorStringSingleVerbatimUnterminated,

  #[regex("@[^\"'\\s]\\S+")]
  ErrorStringMissingQuotes,
```

And with that, we've handled all of the non-trivia tokens in [Jsonnet].

### Trivia

[Jsonnet] supports the following kind of trivia:

- Single-line c-like comments: `// comment`.
- Single-line python-like comments: `# comment`.
- Multi-line c-like comments: `/* comment */`.
- Whitespace: any amount of space (``), tab (`\t`), linefeed (`\n`) and carriage return (`\r`).

There are also a couple of error cases:

- Unterminated multiline comments.
- Too short multiline comments (`/*/`). Note that because [logos] prefers longer tokens, this will only be the case if the comment isn't closed later.

Alltogether we have the following new `RawToken` variants:

```rust
  #[token("/*/")]
  ErrorCommentTooShort,

  #[regex(r"/\*([^*]|\*[^/])+")]
  ErrorCommentUnterminated,

  #[regex(r"[ \t\n\r]+")]
  Whitespace,

  #[regex(r"//[^\r\n]*(\r\n|\n)?")]
  SingelLineSlashComment,

  #[regex(r"#[^\r\n]*(\r\n|\n)?")]
  SingleLineHashComment,

  #[regex(r"/\*([^*]|\*[^/])*\*/")]
  MultiLineComment,
```

And that's it. That's all of the `RawToken` variants for the [Jsonnet] lexer.

# Wrapping it all up

The rest of the lexer is mostly a giant mapping between `RawToken`s and the exported `TokenKind`, as well as a wrapper around the [logos] lexer to provide peeking. When compiling with `cfg(debug_assertions)` I also keep track of the total emited length of all the tokens, and make sure it matches up to how far into the source text we've lexed, just to make sure we don't have any holes (any text is skipped). This is important, because remember, our `Token` struct only consists of a `len: u32` field to keep track of how far into the input text we've traversed. All of the code is available [here][lexer source]. Next time I will probably either look at the tokenization of the string block (which is a whole ordeal onto itself), or start looking at the actual parser. By that time, the blog will also be updated so that there will be links to the next post in the series available both at the top of this post, and down here at the bottom 🙂. Comments will also be coming once I figure out how I want to do it, but untill then, there's a github issue available, so please leave your comments [here][github issue].

[^1]: Currently, the jssonet parser only provides errors and no warnings, and the error-recovery is ... bad, but the infrastructure is there.
[^2]: Editor integration is also a goal of this project. Don't know if I'll ever get there though, as that's further down on my priority list.
[^3]: This is typically called "trivia", name taken from [roslyn] (as far as I know, but may very well have originated much earlier).
[^4]: Not _exactly_ exactly. I had to read some go code to figure out how to deal with string blocks.
[^5]: Not really the case for identifiers typically, but definitely strings tends to need to be modified after parsing. For instance, the string `"\n"` should end up as not the two characters `\` and `n`, but instead as a single newline character.
[^6]: I _might_ make a separate post about that. I'm not sure yet.

[jsonnet]: https://jsonnet.org/ 'Jsonnet website'
[stdlib]: https://github.com/google/jsonnet/blob/master/stdlib/std.jsonnet 'Jsonnet STD lib'
[go implementation]: https://github.com/google/go-jsonnet 'Jsonnet Go Implementation'
[syn]: https://crates.io/crates/syn 'syn crate'
[rust analyzer]: https://rust-analyzer.github.io/ 'rust analyser'
[matklad]: https://matklad.github.io/ "matklad (Aleksey Kladov)'s blog"
[pratt parsing]: https://matklad.github.io/2020/04/13/simple-but-powerful-pratt-parsing.html 'Simple but Powerful Pratt Parsing - matklad'
[parse_tree]: https://github.com/matklad/parse_tree 'A library for non-abstract parse trees.'
[fall]: https://github.com/matklad/fall 'Fall: Not Yet Another Parser Generator'
[rowan]: https://github.com/rust-analyzer/rowan 'Rowan - a library for lossless syntax trees'
[rust interner]: https://matklad.github.io/2020/03/22/fast-simple-rust-interner.html 'Fast and Simple Rust Interner - matklad'
[roslyn]: https://github.com/dotnet/roslyn 'The Roslyn .NET compiler provides C# and Visual Basic languages with rich code analysis APIs.'
[jsonnet spec]: https://jsonnet.org/ref/spec.html 'Jsonnet Specification'
[logos]: https://crates.io/crates/logos 'Logos - Create ridiculously fast Lexers'
[json spec]: http://json.org/ 'JSON specification'
[lexer source]: https://github.com/YoloDev/yolodev-jsonnet/blob/58cf0a50050849831e64a56984423e65695eb23e/crates/lex/src/lib.rs 'Jsonnet lexer source'
[github issue]: https://github.com/Alxandr/alxandr.me/issues/43 'Comments: Rust Jsonnet: Lexer'
