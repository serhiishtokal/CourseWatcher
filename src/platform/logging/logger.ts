import chalk from 'chalk';

function print(label: string, color: (text: string) => string, message: string): void {
  console.log(`${color(label)} ${message}`);
}

export function log(message: string): void {
  print('[CourseWatcher]', chalk.blue, message);
}

export function success(message: string): void {
  print('[CourseWatcher]', chalk.green, message);
}

export function error(message: string): void {
  print('[CourseWatcher]', chalk.red, message);
}
