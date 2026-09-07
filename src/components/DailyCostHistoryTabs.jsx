import React from "react";
import PropTypes from "prop-types";
import DailyHistoryCharts from "./DailyHistoryCharts";

const DailyCostHistoryTabs = ({ provider, accountId, currency }) => {
  return (
    <DailyHistoryCharts
      provider={provider}
      accountId={accountId}
      currency={currency}
    />
  );
};

DailyCostHistoryTabs.propTypes = {
  provider: PropTypes.oneOf(["azure", "aws"]).isRequired,
  accountId: PropTypes.string.isRequired,
  currency: PropTypes.string,
};

export default DailyCostHistoryTabs;
