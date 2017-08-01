import Helmet from 'react-helmet';
import PropTypes from 'prop-types';
import React from 'react';

// TODO: React 16 - return array.
const TemplateWrapper = ({ children }) =>
  <div className="template-wrapper">
    <Helmet titleTemplate="%s | Alxandr.me" defaultTitle="Alxandr.me" />
    {children()}
  </div>;

TemplateWrapper.propTypes = {
  children: PropTypes.func.isRequired,
};

export default TemplateWrapper;
