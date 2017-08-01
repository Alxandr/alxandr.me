const yaml = require('js-yaml');

module.exports = function exportFrontmatterAttacher() {
  const { gatsby } = this;
  return function exportFrontmatter(tree) {
    if (tree.type !== 'root') return;
    if (tree.children.length === 0) return;
    const child = tree.children[0];
    if (child.type !== 'yaml') return;
    const { value } = child;
    const frontmatter = yaml.safeLoad(value);
    gatsby.aux.frontmatter = Object.freeze(frontmatter);
  };
};
