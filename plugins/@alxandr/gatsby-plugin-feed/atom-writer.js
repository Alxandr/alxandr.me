const { Readable } = require('stream');
const xmlbuilder = require('xmlbuilder');

function* element(xml, type, value) {
  yield xml.element(type);
  yield xml.cdata(value);
  yield xml.up();
}

function* person(xml, type, person) {
  yield xml.element(type);

  if (typeof person === 'string') {
    yield* element(xml, 'name', person);
    yield xml.up(); // </{type}>
    return;
  }

  yield* element(xml, 'name', person.name);

  if (person.email) {
    yield* element(xml, 'email', person.email);
  }

  if (person.uri) {
    yield* element(xml, 'uri', person.uri);
  }

  yield xml.up(); // </{type}>
}

function* createIterator(feed, onData, onEnd, genFn) {
  const xml = xmlbuilder.begin(onData, onEnd);
  yield null;
  yield xml.declaration('1.0', 'UTF-8', true);
  yield xml.element('feed');
  yield xml.attribute('xmlns', 'http://www.w3.org/2005/Atom');

  yield* element(xml, 'id', feed.link);
  yield* element(xml, 'title', feed.title);

  if (feed.subtitle) {
    yield* element(xml, 'subtitle', feed.subtitle);
  }

  // Special attributed snowflake
  yield xml.element('link');
  yield xml.attribute('href', feed.link);
  yield xml.up();

  yield* element(xml, 'updated', feed.updated);

  // Special attributed snowflake
  if (feed.generator) {
    yield xml.element('generator');
    if (typeof feed.generator === 'string') {
      yield xml.cdata(feed.generator);
    } else {
      if (feed.generator.uri) {
        yield xml.attribute('uri', feed.generator.uri);
      }

      if (feed.generator.version) {
        yield xml.attribute('version', feed.generator.version);
      }

      yield xml.cdata(feed.generator.name);
    }
    yield xml.up();
  }

  if (feed.authors) {
    for (const author of feed.authors) {
      yield* person(xml, 'author', author);
    }
  }

  if (feed.contributors) {
    for (const contributor of feed.contributors) {
      yield* person(xml, 'contributor', contributor);
    }
  }

  // Special attributed snowflake
  if (feed.feedLink) {
    yield xml.element('link');
    yield xml.attribute('rel', 'self');
    yield xml.attribute('href', feed.feedLink);
    yield xml.up();
  }

  // Special attributed snowflake
  if (feed.categories) {
    for (const category of feed.categories) {
      yield xml.element('category');
      yield xml.attribute('term', category);
      yield xml.up();
    }
  }

  if (feed.icon) {
    yield* element(xml, 'icon', feed.icon);
  }

  if (feed.logo) {
    yield* element(xml, 'logo', feed.logo);
  }

  if (feed.rights) {
    yield* element(xml, 'rights', feed.rights);
  }

  for (const entry of genFn()) {
    yield xml.element('entry');

    yield* element(xml, 'id', entry.id);
    yield* element(xml, 'title', entry.title);
    yield* element(xml, 'updated', entry.updated);

    if (entry.published) {
      yield* element(xml, 'published', entry.published);
    }

    if (entry.link) {
      yield xml.element('link');
      yield xml.attribute('rel', 'alternate');
      yield xml.attribute('href', entry.link);
      yield xml.up();
    }

    //const authors = entry.authors || feed.authors;
    if (entry.authors) {
      for (const author of entry.authors) {
        yield* person(xml, 'author', author);
      }
    }

    if (entry.contributors) {
      for (const contributor of entry.contributors) {
        yield* person(xml, 'contributor', contributor);
      }
    }

    // Special attributed snowflake
    if (entry.categories) {
      for (const category of entry.categories) {
        yield xml.element('category');
        yield xml.attribute('term', category);
        yield xml.up();
      }
    }

    if (feed.rights) {
      yield* element(xml, 'rights', feed.rights);
    }

    if (entry.summary) {
      yield* element(xml, 'summary', entry.summary);
    }

    yield xml.element('content');
    yield xml.attribute('type', 'html');
    yield xml.cdata(entry.content);
    yield xml.up();

    yield xml.up(); // </entry>
  }

  yield xml.up(); // </feed>
  yield xml.end();
}

class AtomWriter extends Readable {
  constructor(feed, fn) {
    let done = false;
    let gen = null;
    let pause = true;

    super({
      encoding: 'utf8',
      read: () => {
        if (done) {
          this.push(null);
          return;
        }

        if (gen === null) {
          gen = createIterator(
            feed,
            data => {
              if (!this.push(data, 'utf8')) {
                pause = true;
              }
            },
            () => {
              done = true;
            },
            fn,
          );
        }

        pause = false;
        while (!done && !pause) {
          const { done: genDone } = gen.next();
          if (genDone) throw new Error('This should never happen...');
        }

        if (done) {
          this.push(null);
        }
      },
    });
  }
}

const createWriter = (feed, entryGenFn) => new AtomWriter(feed, entryGenFn);
module.exports = createWriter;
