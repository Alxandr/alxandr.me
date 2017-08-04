import PropTypes from 'prop-types';
import React from 'react';
import formatDate from 'date-fns/format';

const defaultFormat = 'DD MMM YYYY';

const DateTime = ({ date, format, className }) =>
  <time className={className} dateTime={date}>
    {formatDate(date, format)}
  </time>;

DateTime.propTypes = {
  date: (props, propName, componentName) => {
    if (
      !/^\d{4}-[01]\d-[0-3]\dT[0-2]\d:[0-5]\d:[0-5]\d(\.\d+)?([+-][0-2]\d:[0-5]\d|Z)$/.test(
        props[propName],
      )
    ) {
      return new Error(
        `Invalid prop '${propName} supplied to '${componentName}'. '${props[
          propName
        ]}' does not match ISO date format.`,
      );
    }
  },

  format: PropTypes.string.isRequired,
  className: PropTypes.string,
};

DateTime.defaultProps = {
  format: defaultFormat,
};

export default DateTime;
