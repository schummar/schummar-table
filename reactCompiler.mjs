import babel from '@rolldown/plugin-babel';
import reactCompilerPlugin from 'babel-plugin-react-compiler';

/** React Compiler as a rolldown/vite plugin. */
export function reactCompiler() {
  return babel({
    include: /\.[jt]sx?$/,
    plugins: [[reactCompilerPlugin, { target: '19' }]],
  });
}

/** Set REACT_COMPILER=1 to run tests, benchmarks and Storybook with the compiler. */
export const isReactCompilerEnabled = ['1', 'true'].includes(process.env.REACT_COMPILER ?? '');
