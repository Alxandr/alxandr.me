---
title: 'Xando pt. 3 - JSON'
date: '2016-09-21'
series: xando
tags: ['Xando', 'CQRS', 'Event Sourcing', 'F#']
issue: 10
---

Previously we looked at events and commands, and this time we'll look at converting events (primarily) to and from JSON. The code can be used for commands too (with really minor modifications), but it's primarily made for dealing with events.

First, let's take a look at the code used to represent events again:

```fsharp
[<EventType(categoryName)>]
type Event =
| Registered of mail: Email * username: string * password: Password * reason: string
| PasswordChanged of password: Password * reason: string
| EmailChanged of mail: Email * reason: string
| Deleted of reason: string
```

Here we have 4 different events. In [EventStore][eventstore], an event has a separate "name" and "data" field. This means that for a "registered" event, I'm going to end up with an event in EventStore with the name `user:registered` and the data:

```json
{
  "mail": "<mail>",
  "username": "<username>",
  "password": "<password>",
  "reason": "<reason>"
}
```

The `user:`-prefix is caused by the `EventType` attribute (`categoryName` is a literal with the value `"user"`). So, how do we get from my JSON representation to an instance of `Event` and back again?

# Event Data

Before we start looking at converting to and from event data, we need to define what event data actually is. I'm not using the types provided by the [EventStore client][eventstoreclient] package, because they are made for C# and I don't like them. Therefore, I'm creating my own F# record for event data, and a simple conversion between my event data structure and the one used by EventStore:

```fsharp
type EventData<'data> = internal {
  streamId: string
  id: Guid
  number: int
  created: Instant
  value: 'data
}
```

The `Instant` type is from [Noda Time][nodatime]. Now, the EventStore client uses 2 different representations of events depending on whether they are read from the database (`RecordedEvent`) or if they are to be written to the database (`EventData`). This means that the conversion will be asymmetric. Another key difference in my representation is that it's generic. Whereas the `RecordedEvent` from EventStore has a binary blob of data, I instead have a `'data` generic representation. This means that in order to go from a `RecordedEvent` to a `EventData<'data>`, I actually have to parse the JSON within that blob.

Another thing that I like to do is hyphenate names. This means that I want the event `PasswordChanged` to be named as `user:password-changed`. This may well be vanity on my part, but it's still something I like to do, and thus I am going to do so here as well. So, let's get on to some code shall we?

# Converter Types

First thing we need to do is define the `EventType` attribute you've already seen. Another attribute is `EventName` which allows overriding the event name of a specific union case. This is quite straight forward and just looks as the following:

```fsharp
[<AllowNullLiteral>]
type EventTypeAttribute private (name: string option) =
  inherit System.Attribute ()
  new (name: string) = EventTypeAttribute (Some name)
  new () = EventTypeAttribute (None)
  member __.name = name

[<AllowNullLiteral>]
type EventNameAttribute (name: string) =
  inherit System.Attribute ()
  member __.name = name
```

It allows for specifying a prefix, and allows for not specifying a prefix. It also allows for `null` literals. This is important, because the attribute API in .NET returns `null` if no attribute is present. We could get around this with a custom API that returns an option instead, but it's simpler just to allow `EventTypeAttribute` instances to be `null`. The same goes for `EventNameAttribute` instances.

Next, I have a private representation of a `JsonConverter`. This is not to be confused with the one from [Newtonsoft.Json][newtonsoftjson], but is instead a record that knows how to convert a single union case to and from JSON. This means that we'll have one instance for `Event.Registered`, one instance for `Event.PasswordChanged` etc. The `JsonConverter` record looks like this:

```fsharp
[<NoComparison; NoEquality>]
type private JsonConverter = {
  name: string
  toJson: obj -> JObject
  ofJson: JObject -> obj }
```

The `name` is the converted name of the union case (like `user:registered`), the `toJson` is a function that takes an instance of the union case (like `EmailChanged ("foo@bar.com", "No reason")`) and produces a `JObject` from Newtonsoft.Json, and `ofJson` is the reverse of `toJson`.

Another record we need is one for looking up `UnionCaseInfo` based on either the name (like `user:registered`) or an instance of the union type. I call this a `UnionCaseLookup` and it looks like this:

```fsharp
[<NoComparison; NoEquality>]
type private UnionCaseLookup = {
  byName: string -> UnionCaseInfo
  byInstance: obj -> UnionCaseInfo }
```

Then we need the encoding with which to convert JSON strings to and from the binary data stored in EventStore, as well as caches for the two records above.

```fsharp
let private encoding = System.Text.UTF8Encoding (false, true)
let private converterCache : ConcurrentDictionary<UnionCaseInfo, JsonConverter> = ConcurrentDictionary ()
let private nameCache : ConcurrentDictionary<Type, UnionCaseLookup> = ConcurrentDictionary ()
```

# Dealing with names

The last part of the utility setup I'm going to add is the `hyphenate` method, which takes a string like `FooBarBaz` and turns it into `foo-bar-baz`. There are probably plenty of ways to implement something like this, but I've gone the regex route:

```fsharp
let private hyphenate =
  let regex = Regex ("[a-z][A-Z]", RegexOptions.Compiled ||| RegexOptions.CultureInvariant)
  fun (str: string) ->
    let str =
      let ch1 = str.Substring (0, 1)
      let ch1 = ch1.ToLowerInvariant ()
      ch1 + str.Substring 1
    regex.Replace (str, fun (m: Match) ->
      let v = m.Value.ToLowerInvariant ()
      v.Substring (0, 1) + "-" + v.Substring (1))
```

It's not the most elegant code out there, but it works as intended for my case. The next piece of code takes a `UnionCaseInfo` and gets the event name associated with it.

```fsharp
let private getName (case: UnionCaseInfo): string =
  let namePrefix =
    let t = case.DeclaringType
    match t.GetCustomAttribute<EventTypeAttribute> () with
    | null -> failwithf "Type '%s' not decorated with EventType attribute" t.FullName
    | attr when attr.name = None -> ""
    | attr -> Option.get attr.name + ":"

  match case.GetCustomAttributes typeof<EventNameAttribute> with
  | [||] -> namePrefix + hyphenate case.Name
  | [| attr |] -> namePrefix + (attr :?> EventNameAttribute).name
  | _ -> failwith "multiple name attributes on union case"
```

As you can see from this method, I require all event types to be decorated with `EventType` attributes. This is not required of cause, but I like to be explicit about what is an event type this way. Another thing to notice is that I only do hyphenation on event names that are based on the actual type names, not if provided by a `EventName` attribute.

The next piece of the puzzle is creating a `UnionCaseLookup` from a event type. This is a function that takes a `Type`, and returns a `UnionCaseLookup` that can be used to get `UnionCaseInfo`s from either instances of the type, or event names (from the database). The result is then cached in the `nameCache` we defined above. This code is also not too hard, but it does use some functional composition which can be confusing, so I will go through explaining what it all does:

```fsharp
let private getNameMap (t: Type) =
  let swap f a b = f b a

  let makeMap (t: Type) =
    // TODO: Specially deal with Choice<> types
    if not (FSharpType.IsUnion (t, true)) then failwith "Only supported for type unions"
    let tagLookup = FSharpValue.PreComputeUnionTagReader (t, true)
    let cases = FSharpType.GetUnionCases (t, true) |> List.ofArray
    let byName =
      cases
      |> List.map (fun case -> getName case, case)
      |> Map.ofList
    let byTag =
      cases
      |> List.map (fun case -> case.Tag, case)
      |> Map.ofList

    { byName = (swap Map.find) byName
      byInstance = tagLookup >> (swap Map.find) byTag }

  nameCache.GetOrAdd (t, makeMap)
```

As you can see from the "TODO" comment, I plan to improve this later to support working with things like `Choice<User.Event, Group.Event>` in which case I get all of the events, but that has yet to be implemented. So for now, let's go through the code above and look at what it does.

The first part is a utility function. `swap` takes a function `f: a -> b -> c` and returns the same function with it's arguments swapped: `f: b -> a -> c`. This is useful, because it means I can take the `Map.find` function which takes the map as a second parameter, and turn it into a function which takes the map as the first parameter and then partially apply it. The second part, the `makeMap` function is called by `nameCache.GetOrAdd` if the type `t` is not already in the cache. The real functionality is inside the `makeMap` function.

The first thing we do inside of `makeMap` is ensure that we're actually working with a union type. I require all my events to be of a union type, and this code will throw an exception if that is not the case. Then, we precompute a tag reader. Now, this has to do with how discrete unions work in F#. When you compile a discrete union like the following:

```fsharp
type MyUnion =
| Foo
| Bar
| Baz
```

The F# compiler creates 4 classes. One named `MyUnion`, and a sub-class for each of the `Foo`, `Bar` and `Baz` types. Each of these sub-classes has a `Tag` property, which is how F# does pattern matching on the types. As far as I've understood there is a performance advantage to simply doing a int test (like `myUnionInst.Tag = 0`) instead of a type test (`myUnionInst :? Foo`). But why it's done this way is of little importance to us, the important thing to know is that it does work this way. So a tag reader here is a function that takes an instance of our event type and returns the tag, which is a simple integer.

After getting the tag reader, we get a list of all the different union cases in our event type. This represents all the different event types. We then produce a map of type `Map<string, UnionCaseInfo>` and one for the tags of type `Map<int, UnionCaseInfo>`. Lastly, we turn these into lookup functions using our `swap` from earlier (and composing with the tag reader in the `byInstance` case) and then return it as a instance of `UnionCaseLookup`.

# Converting to and from JSON

Most of the building blocks we need for converting to and from JSON is done now, what's lacking is only the actual implementation of our converters. Remember, we store the converters too in a cache, so the function will have the same overall structure as the `getNameMap` one did, except the inner function will obviously be very different. So, without further ado, here is `getConverter`:

```fsharp
let private getConverter (case: UnionCaseInfo) =
  let makeConverter (case: UnionCaseInfo) =
    let fields = case.GetFields () |> List.ofArray
    let ctor = FSharpValue.PreComputeUnionConstructor (case, true)
    let reader = FSharpValue.PreComputeUnionReader (case, true)
    let props = fields |> List.map (fun prop -> hyphenate prop.Name, prop.PropertyType)

    let toJson o =
      reader o
      |> List.ofArray
      |> List.zip (List.map fst props)
      |> List.map JProperty
      |> JObject

    let ofJson (j: JObject) =
      props
      |> List.map (fun (n, t) -> let token = j.GetValue n :?> JValue in token.ToObject (t, Json.serializer))
      |> List.toArray
      |> ctor

    { name = getName case
      toJson = toJson
      ofJson = ofJson }

  converterCache.GetOrAdd (case, makeConverter)
```

The first thing the `makeConverter` function does here is get a list of all fields of the union case. In the case of `Registered` for instance, that is the fields `mail`, `username`, `password` and `reason`. It then precomputes a constructor (which takes those 4 fields and returns a `Registered` instance) and a reader (which takes an instance of `Registered` and returns the values of the 4 fields). Then I create a `toJson` function which does the following:

1. Read all the fields from the event. Assuming our event is `EmailChanged ("foo@bar.com", "No Reason")`, we would get the array `[| "foo@bar.com"; "No Reason" |]`.
2. Convert the array into a list.
3. Zip the lists with the property names. We now have the list `["email", "foo@bar.com"; "reason", "No Reason"]`.
4. Create `JProperty` instances for each item in the list.
5. Create a `JObject` from the list of `JProperty`s.

The `ofJson` function does something somewhat similar:

1. For each property (in the `EmailChanged` case this will be the list `["email", typeof<Email>; "reason", typeof<string>]`) get the value of the property with that name in the JSON object (`j.GetValue n`), and then convert it to the correct type `token.ToObject (t, Json.serializer)`. The `Json.serializer` here is my global JSON serializer to ensure the same settings are applied everywhere.
2. Create an array of the values. In our case we're back to `[| "foo@bar.com"; "No Reason" |]`.
3. Call the constructor.

We then construct and return a `JsonConverter` from the two functions and the name of the union case.

And finally we have a little utility function for doing parsing of the JSON, since that requires a name to figure out which union case to use:

```fsharp
let internal ofJson<'data> (json: JObject) (eventType: string) =
  let lookup = getNameMap typeof<'data>
  let case = lookup.byName eventType
  let converter = getConverter case
  converter.ofJson json :?> 'data
```

This function is really straight forward, and I'm not going to explain what the steps here are, since all of it should be covered earlier in this post. Now, I did plan to also write about converting to and from the EventStore representations of events, but this post has already gotten longer than I am comfortable with, so I'm going to end it here and leave that for another time. If you have any questions, and find any errors, please leave a comment down bellow.

[eventstore]: https://geteventstore.com
[eventstoreclient]: https://www.nuget.org/packages/EventStore.Client/
[nodatime]: https://www.nuget.org/packages/NodaTime
[newtonsoftjson]: https://www.nuget.org/packages/Newtonsoft.Json/
