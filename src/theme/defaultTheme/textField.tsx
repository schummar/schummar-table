import type { TableTheme } from '../../types';

export const TextField: TableTheme['components']['TextField'] = ({
  startIcon,
  endIcon,
  className,
  inputRef,
  onBlur,
  ...props
}) => {
  return (
    <div
      className={className}
      css={[
        {
          flex: 1,
          display: 'flex',
          alignItems: 'center',
          border: '1px solid var(--table-textfield-border, var(--table-border, #777777))',
          borderRadius: 4,

          '&:focus-within': {
            border: '2px solid var(--primaryMain)',
            margin: -1,
          },
        },
      ]}
    >
      {startIcon}

      <input
        ref={inputRef}
        {...props}
        value={props.value ?? ''}
        onBlur={onBlur}
        css={{
          minWidth: 0,
          width: '100%',
          flex: 1,
          border: 'none',
          outline: 'none',
          borderRadius: 4,
          padding: 'calc(var(--spacing) * 2)',
          paddingLeft: startIcon ? 0 : undefined,
          paddingRight: endIcon ? 0 : undefined,
          transition: 'outline 500ms',
        }}
      />

      {endIcon}
    </div>
  );
};
