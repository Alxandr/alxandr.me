import { DateTime } from 'luxon';
import React from 'react';

const FormattedDateTime = ({ date, ...rest }) => (
  <time dateTime={date} {...rest}>
    {DateTime.fromISO(date).toLocaleString(DateTime.DATE_MED)}
  </time>
);

FormattedDateTime.propTypes = {
  date: (props, propName, componentName) => {
    if (
      !/^\d{4}-[01]\d-[0-3]\dT[0-2]\d:[0-5]\d:[0-5]\d(\.\d+)?([+-][0-2]\d:[0-5]\d|Z)$/.test(
        props[propName],
      )
    ) {
      return new Error(
        `Invalid prop '${propName} supplied to '${componentName}'. '${
          props[propName]
        }' does not match ISO date format.`,
      );
    }
  },
};

export default FormattedDateTime;
