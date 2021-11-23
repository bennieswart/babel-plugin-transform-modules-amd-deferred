const path = require('path');

const marker = /^ *@deferred *$/;
const importSpecifiers = ['ImportDefaultSpecifier', 'ImportSpecifier', 'ImportNamespaceSpecifier'];

module.exports = function (babel) {
  const { template, types: t } = babel;
  const buildImport = template('DECLARATION; require([MODULE], function(ARG) { ASSIGNMENTS })');
  
  return {
    visitor: {
      ImportDeclaration(nodepath) {
        if (!(nodepath.node.trailingComments || []).some(c => marker.test(c.value))) {
          return;
        }
        const specs = nodepath.node.specifiers.map(spec => {
          if (!importSpecifiers.includes(spec.type) || spec.local.type !== 'Identifier') {
            throw Error('Unexpected format for import specifier');
          }
          return spec;
        });
        let ARG = '_';
        while (specs.some(spec => spec.local.name === ARG)) {
          ARG += '_';
        }
        const MODULE = t.StringLiteral(path.normalize(path.join(
          path.dirname(this.getModuleName()),
          nodepath.node.source.value
        )));
        const DECLARATION = specs.length ? t.VariableDeclaration(
          'let',
          specs.map(spec => t.VariableDeclarator(t.Identifier(spec.local.name)))
        ) : null;
        const ASSIGNMENTS = specs.map(spec =>
          t.ExpressionStatement(
            t.AssignmentExpression(
              '=',
              t.Identifier(spec.local.name),
              spec.type === 'ImportNamespaceSpecifier'
                ? t.Identifier(ARG)
                : t.MemberExpression(
                  t.Identifier(ARG),
                  t.Identifier(spec.type === 'ImportDefaultSpecifier' ? 'default' : spec.local.name)
                )
            )
          )
        );
        const replace = buildImport({ DECLARATION, ARG, ASSIGNMENTS, MODULE });
        nodepath.replaceWithMultiple(replace);
      }
    }
  };
};
