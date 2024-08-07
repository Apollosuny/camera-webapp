import classNames from 'classnames';

type BodyTextProps = {
  type: 1 | 2 | 3;
  /**
   * Pass custom classNames such as text alignment and color
   *
   * For one-offs (e.g. a slightly bolder Body 1), `font-weight` can be overwritten here. Font size and line height should never be set through this prop.
   */
  customClassName?: string;
  /**
   * To use a tag other than `p`, e.g. `span`
   */
  as?: React.ElementType;
  children: React.ReactNode;
};

export const BODY_TEXT_1_CLASSNAME =
  'text-base font-normal leading-tight xl:text-lg xl:leading-tight';

export const BodyText: React.FC<BodyTextProps> = ({
  type,
  customClassName,
  children,
  as = 'p',
}) => {
  const As = as;
  return (
    <As
      className={classNames(
        'font-Aeonik',
        {
          [BODY_TEXT_1_CLASSNAME]: type === 1,
          'text-base font-medium leading-tight xl:text-lg xl:leading-tight':
            type === 2,
          'text-base font-bold leading-tight xl:text-lg xl:leading-tight':
            type === 3,
        },
        customClassName
      )}
    >
      {children}
    </As>
  );
};
