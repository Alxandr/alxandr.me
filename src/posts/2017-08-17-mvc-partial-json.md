---
type:   post
title:  "ASP.NET Core MVC and json patches"
date:   "2017-08-16T16:49:34.350Z"
tags:   ["ASP.NET Core", ".NET Core", ".NET Standard", "MVC", "JSON", "API"]
author: Alxandr
issue:  14
---

It's been waaaaaay too long since I last wrote a blog post, so I figured it was about time I did so again.
That being said, this'll probably be a rather short blog post. I've recently wrote a small .NET Standard
library (it runs on both .NET Core and the full .NET Framework) that deals with partial JSON objects (and
just partial objects in general). But before I go into explaining what the library does, I'd like to
explain a bit better the problem it's trying to solve.

## Partial object
A partial object is an object in which not all properties have been set. Any property in a partial object
will always have a value, just like a normal object, but it will also track whether or not the object is
set. Allow me to give a demonstration of the API of partial objects:

```csharp
var partialPerson = Partial.Create<Person>();
var person = partialPerson.Proxy; // will have type Person
person.Name = "Per";
person.Age = 10;

partialPerson.IsSet(p => p.Name); // true
partialPerson.IsSet(p => p.Age); // true
partialPerson.IsSet(p => p.Address); // false

var updates = partialPerson.GetUpdates();
// updates is IImmutableDictionary<string, object>

var dbPerson = SomehowGetPersonFromDb();
partialPerson.Populate(dbPerson);
// sets dbPerson.Name => "Per" and dbPerson.Age => 10.

// All partial proxies implement IPartialProxy.
var asProxy = person as IPartialProxy;
var asTypedProxy = person as IPartialProxy<Person>;

var partialFromProxy = asTypedProxy.Partial;
// partialFromProxy is the same instance as partialPerson.
```

The API itself is not set in stone yet, and I might add/change things, but the base capability is staying.
This allows you to easily do stuff like only update the columns that have actually changed when saving to
the database. However, partial objects really shine when combined with ASP.NET Core MVC and JSON requests.

## JSON API
A nice feature about partial objects is that the `IPartial<T>` interface has a decorated json decoder set
for [Newtonsoft.Json][newtonsoft]. This allows you to create APIs like this:

```csharp
[HttpPatch]
public async Task<IActionResult> Person(int id, [FromBody] IPartial<Person> partialPerson)
{
  if (partialPerson.IsSet(p => p.Id))
  {
    return BadRequest();
  }

  var person = await _person.Get(id);
  partialPerson.Populate(person);
  _person.Save(person);
  return Ok();
}
```

Or alternatively, if you implement support for it on the service layer:

```csharp
[HttpPatch]
public async Task<IActionResult> Person(int id, [FromBody] IPartial<Person> partialPerson)
{
  if (partialPerson.IsSet(p => p.Id))
  {
    return BadRequest();
  }

  await _person.Update(partialPerson);
  return Ok();
}
```

This will allow you to send partial updates to the API like the following that will only
update the age of a person:

```json
{
  "age": 15
}
```

## Where to get it?
The package can be found on [nuget][nuget-package], and [github][github-repo]. If you have any
issues with the package, please raise github issues. If you have any comments, please follow
the link below.

[newtonsoft]: http://www.newtonsoft.com/json
[nuget-package]: https://www.nuget.org/packages/YoloDev.PartialJson/
[github-repo]: https://github.com/YoloDev/YoloDev.PartialJson
