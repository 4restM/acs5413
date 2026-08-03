import { describe, expect, it, jest } from '@jest/globals';
import { fireEvent, render } from '@testing-library/react-native';

import { ScreenState } from './screen-state';

describe('ScreenState', () => {
  it('renders a useful empty state and calls its action', async () => {
    const onAction = jest.fn();
    const view = await render(<ScreenState title="No supplies yet" message="Add a supply to begin." actionLabel="Add supply" onAction={onAction} />);

    expect(view.getByText('No supplies yet')).toBeTruthy();
    fireEvent.press(view.getByRole('button', { name: 'Add supply' }));
    expect(onAction).toHaveBeenCalledTimes(1);
  });

  it('announces error content with an alert role', async () => {
    const view = await render(<ScreenState title="Inventory unavailable" message="Try again." tone="error" />);

    const title = view.getByText('Inventory unavailable');
    expect(title.parent?.props.accessibilityRole).toBe('alert');
    expect(title).toBeTruthy();
  });
});
