use solana_program::{
    account_info::AccountInfo,
    entrypoint,
    entrypoint::ProgramResult,
    msg,
    pubkey::Pubkey,
};

// Define the program's entrypoint
entrypoint!(process_instruction);

// Main function
pub fn process_instruction(
    _program_id: &Pubkey,
    _accounts: &[AccountInfo],
    _instruction_data: &[u8],
) -> ProgramResult {
    msg!("Add predefined numbers program started.");

    let number1: u16 = 5; // First predefined number
    let number2: u16 = 7; // Second predefined number

    let sum = number1 + number2;

    msg!("Number 1: {}", number1);
    msg!("Number 2: {}", number2);
    msg!("Sum: {}", sum);

    Ok(())
}
