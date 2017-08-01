import PropTypes from 'prop-types';
import React from 'react';
import injectSheet from 'react-jss';

const cache = new Map();

const ForwardClasses = ({ children, classes }) => children(classes);

ForwardClasses.propTypes = {
  children: PropTypes.func.isRequired,
  classes: PropTypes.objectOf(PropTypes.string.isRequired).isRequired,
};

const Styled = ({ styles, children }) => {
  if (!cache.has(styles)) {
    cache.set(styles, injectSheet(styles)(ForwardClasses));
  }

  const Injected = cache.get(styles);
  return (
    <Injected>
      {children}
    </Injected>
  );
};

Styled.propTypes = {
  styles: PropTypes.oneOfType([
    PropTypes.func.isRequired,
    PropTypes.objectOf(PropTypes.object.isRequired),
  ]).isRequired,
  children: PropTypes.func.isRequired,
};

export default Styled;
