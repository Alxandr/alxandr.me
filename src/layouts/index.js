import Helmet from 'react-helmet';
import PropTypes from 'prop-types';
import React from 'react';

const Aux = ({ children }) => children;

const TemplateWrapper = ({ children }) => (
  <Aux>
    <Helmet titleTemplate="%s | Alxandr.me" defaultTitle="Alxandr.me" />
    {children()}
  </Aux>
);

TemplateWrapper.propTypes = {
  children: PropTypes.func.isRequired,
};

export default TemplateWrapper;
