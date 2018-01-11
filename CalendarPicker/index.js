import React, { Component } from 'react';
import {
  View,
  Text,
  Dimensions,
  StyleSheet,
} from 'react-native';
import { makeStyles } from './makeStyles';
import { Utils } from './Utils';
import HeaderControls from './HeaderControls';
import Weekdays from './Weekdays';
import DaysGridView from './DaysGridView';
import Swiper from './Swiper';
import moment from 'moment';

const SWIPE_LEFT = 'SWIPE_LEFT';
const SWIPE_RIGHT = 'SWIPE_RIGHT';

const swipeConfig = {
  velocityThreshold: 0.3,
  directionalOffsetThreshold: 80
};

export default class CalendarPicker extends Component {
  constructor(props) {
    super(props);
    this.state = {
      currentMonth: null,
      currentYear: null,
      selectedStartDate: null,
      selectedEndDate: null,
      styles: {},
    };
    this.updateScaledStyles = this.updateScaledStyles.bind(this);
    this.updateMonthYear = this.updateMonthYear.bind(this);
    this.handleOnPressPrevious = this.handleOnPressPrevious.bind(this);
    this.handleOnPressNext = this.handleOnPressNext.bind(this);
    this.handleOnPressDay = this.handleOnPressDay.bind(this);
    this.onSwipe = this.onSwipe.bind(this);
  }

  static defaultProps = {
    initialDate: new Date(),
    scaleFactor: 375,
  }

  componentWillMount() {
    this.setState({...this.updateScaledStyles(this.props), ...this.updateMonthYear(this.props.initialDate)});
  }

  componentWillReceiveProps(nextProps) {
    let newStyles = {};
    let doStateUpdate = false;

    if (nextProps.width !== this.props.width ||
        nextProps.height !== this.props.height)
    {
      newStyles = this.updateScaledStyles(nextProps);
      doStateUpdate = true;
    }

    let newMonthYear = {};
    if (nextProps.initialDate.getTime() !== this.props.initialDate.getTime()) {
      newMonthYear = this.updateMonthYear(nextProps.initialDate);
      doStateUpdate = true;
    }

    if (doStateUpdate) {
      this.setState({...newStyles, ...newMonthYear});
    }
  }

  updateScaledStyles(props) {
    const {
      scaleFactor,
      selectedDayColor,
      selectedDayTextColor,
      todayBackgroundColor,
      width, height,
      selectRangeColor,
    } = props;

    // The styles in makeStyles are intially scaled to this width
    const containerWidth = width ? width : Dimensions.get('window').width;
    const containerHeight = height ? height : Dimensions.get('window').height;
    const initialScale = Math.min(containerWidth, containerHeight) / scaleFactor;
    return {styles: makeStyles(initialScale, selectedDayColor, selectedDayTextColor, todayBackgroundColor, selectRangeColor)};
  }

  updateMonthYear(initialDate = this.props.initialDate) {
    return {
      currentMonth: parseInt(initialDate.getMonth()),
      currentYear: parseInt(initialDate.getFullYear()),
    };
  }

  handleOnPressDay(day, type) {
    const {
      currentYear,
      currentMonth,
      selectedStartDate,
      selectedEndDate,
    } = this.state;

    const {
      allowRangeSelection,
      onDateChange,
      maxDays
    } = this.props;

    const date = new Date(currentYear, currentMonth, day);
    let dayEndValid = true;

    if (allowRangeSelection &&
        selectedStartDate &&
        date >= selectedStartDate &&
        (selectedEndDate === selectedStartDate || !selectedEndDate)) {
          
        const days = moment(date).diff(moment(selectedStartDate), 'days');
        
        if(days > maxDays) {
          dayEndValid = false;
          let maxDateValid = new Date(selectedStartDate);
          maxDateValid.setDate(selectedStartDate.getDate() + maxDays);

          const newDate = new Date(maxDateValid.getFullYear(), maxDateValid.getMonth(), maxDateValid.getDate());
          this.setState({
            selectedEndDate: newDate,
          });
          onDateChange(newDate, Utils.END_DATE, dayEndValid);
        } else {
          this.setState({
            selectedEndDate: date,
          });
          onDateChange(date, Utils.END_DATE, dayEndValid);
        }
    } else {
      this.setState({
        selectedStartDate: date,
        selectedEndDate: null,
      });
      // propagate to parent date has changed
      onDateChange(date, Utils.START_DATE, dayEndValid);
    }
  }

  handleOnPressPrevious() {
    let { currentMonth, currentYear } = this.state;
    let previousMonth = currentMonth - 1;
    // if previousMonth is negative it means the current month is January,
    // so we have to go back to previous year and set the current month to December
    if (previousMonth < 0) {
      previousMonth = 11;
      currentYear -= 1;  // decrement year
      this.setState({
        currentMonth: parseInt(previousMonth), // setting month to December
        currentYear: parseInt(currentYear),
      });
    } else {
      this.setState({
        currentMonth: parseInt(previousMonth),
        currentYear: parseInt(currentYear),
      });
    }
    this.props.onMonthChange && this.props.onMonthChange(new Date(currentYear, previousMonth));
  }

  handleOnPressNext() {
    let { currentMonth, currentYear } = this.state;
    let nextMonth = currentMonth + 1;
    // if nextMonth is greater than 11 it means the current month is December,
    // so we have to go forward to the next year and set the current month to January
    if (nextMonth > 11) {
      nextMonth = 0;
      currentYear += 1;  // increment year
      this.setState({
        currentMonth: parseInt(nextMonth), // setting month to January
        currentYear: parseInt(currentYear),
      });
    } else {
      this.setState({
        currentMonth: parseInt(nextMonth),
        currentYear: parseInt(currentYear),
      });
    }
    this.props.onMonthChange && this.props.onMonthChange(new Date(currentYear, nextMonth));
  }

  onSwipe(gestureName) {
    switch (gestureName) {
      case SWIPE_LEFT:
        this.handleOnPressNext();
        break;
      case SWIPE_RIGHT:
        this.handleOnPressPrevious();
        break;
    }
  }

  render() {
    const {
      currentMonth,
      currentYear,
      selectedStartDate,
      selectedEndDate,
      styles,
    } = this.state;

    const {
      allowRangeSelection,
      startFromMonday,
      initialDate,
      minDate,
      maxDate,
      weekdays,
      months,
      shortMonths,
      previousTitle,
      nextTitle,
      textStyle,
      textWeekdaysStyle,
      selectRangeColor,
      maxDays
    } = this.props;
 
    return (
      <Swiper
        onSwipe={(direction) => this.onSwipe(direction)}
        config={swipeConfig}
      >
        <View syles={styles.calendar}>
          <HeaderControls
            styles={styles}
            currentMonth={currentMonth}
            currentYear={currentYear}
            initialDate={initialDate}
            onPressPrevious={this.handleOnPressPrevious}
            onPressNext={this.handleOnPressNext}
            months={months}
            shortMonths={shortMonths}
            previousTitle={previousTitle}
            nextTitle={nextTitle}
            textStyle={textStyle}
            selectedStartDate={selectedStartDate}
            selectedEndDate={selectedEndDate}
          />
          <Weekdays
            styles={styles}
            startFromMonday={startFromMonday}
            weekdays={weekdays}
            textStyle={textStyle}
            textWeekdaysStyle={textWeekdaysStyle}
          />
          <DaysGridView
            month={currentMonth}
            year={currentYear}
            styles={styles}
            onPressDay={this.handleOnPressDay}
            startFromMonday={startFromMonday}
            allowRangeSelection={allowRangeSelection}
            selectedStartDate={selectedStartDate}
            selectedEndDate={selectedEndDate}
            minDate={minDate && minDate.setHours(0,0,0,0)}
            maxDate={maxDate && maxDate.setHours(0,0,0,0)}
            textStyle={textStyle}
          />
        </View>
      </Swiper>
    );
  }
}
