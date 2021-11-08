import plus from './light_plus';
import vs from './light_vs';

const classesFromScope = (scope: string) => {
  return scope.replace(/\./g, '-');
};

const toArray = (strOrArr: string | readonly string[]): readonly string[] =>
  Array.isArray(strOrArr) ? strOrArr : [strOrArr];

type Rule = {
  color?: string;
  'text-decoration'?: string;
  'font-weight'?: string;
  'font-style'?: string;
};

const rules = new Map<string, Rule>();

const update = (name: string, settings: Record<string, string | undefined>) => {
  // console.log(`updating ${name}`);
  let result = rules.get(name);
  if (!result) {
    result = {};
    rules.set(name, result);
  }

  for (const [key, value] of Object.entries(settings)) {
    if (!value) {
      delete (result as any)[key];
      continue;
    }

    switch (key) {
      case 'foreground':
        result['color'] = value.toLowerCase();
        break;

      case 'fontStyle':
        switch (value) {
          case 'underline':
            result['text-decoration'] = 'underline';
            break;

          case 'bold':
            result['font-weight'] = 'bold';
            break;

          case 'italic':
            result['font-style'] = 'italic';
            break;

          default:
            throw new Error(`Unknown fontStyle: '${value}`);
        }
        break;

      default:
        throw new Error(`Unknown setting key: ${key}`);
    }
  }
};

for (const rule of vs.tokenColors) {
  for (const scope of toArray(rule.scope)) {
    update(classesFromScope(scope), rule.settings);
  }
}

for (const rule of plus.tokenColors) {
  for (const scope of toArray(rule.scope)) {
    update(classesFromScope(scope), rule.settings);
  }
}

for (const [className, rule] of rules) {
  let str = `${className
    .split(' ')
    .map((n) => `.${n}`)
    .join(', ')} { `;
  for (const [name, value] of Object.entries(rule)) {
    if (value) {
      str += `${name}: ${value}; `;
    }
  }
  str += `}`;
  console.log(str);
}
