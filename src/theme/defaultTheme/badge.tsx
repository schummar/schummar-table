import type { TableTheme } from '../../types';

export const Badge: TableTheme['components']['Badge'] = ({ badgeContent, children }) => {
  return (
    <span
      css={{
        display: 'inline-flex',
        position: 'relative',
        flexShrink: 0,
        verticalAlign: 'middle',
      }}
    >
      {children}

      <span
        css={[
          {
            top: 0,
            right: 0,
            transform: 'scale(1) translate(50%, -50%)',
            transformOrigin: '100% 0%',
            height: 20,
            display: 'flex',
            padding: '0 6px',
            zIndex: 1,
            position: 'absolute',
            flexWrap: 'wrap',
            minWidth: 20,
            transition: 'transform 225ms cubic-bezier(0.4, 0, 0.2, 1) 0ms',
            alignItems: 'center',
            lineHeight: 1,
            alignContent: 'center',
            borderRadius: 10,
            justifyContent: 'center',
            fontSize: '0.8em',
          },
          !badgeContent && {
            transform: 'scale(0) translate(50%, -50%)',
            transition: 'transform 195ms cubic-bezier(0.4, 0, 0.2, 1) 0ms',
          },
        ]}
      >
        {badgeContent}
      </span>
    </span>
  );
};
